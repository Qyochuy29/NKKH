"""Vietnamese speech-to-text helpers.

The application uses the transcript as evidence for safety alerts, so this
module prioritizes recall and keeps low-confidence speech instead of silently
dropping words from a real conversation.
"""

from __future__ import annotations

import math
import re
import unicodedata

import numpy as np


HALLUCINATION_PHRASES = (
    "subscribe",
    "đăng ký kênh",
    "theo dõi kênh",
    "cảm ơn các bạn đã xem",
    "hẹn gặp lại các bạn",
    "ghiền mì gõ",
)


def get_whisper_waveform(audio_segment) -> np.ndarray:
    """Convert any pydub AudioSegment to normalized 16 kHz mono float32."""
    audio = audio_segment.set_frame_rate(16000).set_channels(1)
    samples = np.asarray(audio.get_array_of_samples(), dtype=np.float32)
    if samples.size == 0:
        return samples
    max_value = float(2 ** (8 * audio.sample_width - 1))
    waveform = samples / max_value
    # Normalize quiet microphone recordings before Whisper/VAD.  ESP32 clips
    # can be intelligible to a human but fall below Whisper's speech gate.
    waveform = waveform - float(np.mean(waveform))
    rms = float(np.sqrt(np.mean(np.square(waveform))))
    if rms > 1e-5:
        gain = min(8.0, 0.12 / rms)
        waveform = waveform * gain
    peak = float(np.max(np.abs(waveform)))
    if peak > 0.98:
        waveform = waveform * (0.98 / peak)
    return np.clip(waveform, -1.0, 1.0).astype(np.float32)


def _normalized_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text or "").strip()
    return re.sub(r"\s+", " ", text)


def _looks_repetitive(text: str) -> bool:
    words = re.findall(r"\w+", text.casefold(), flags=re.UNICODE)
    if len(words) < 6:
        return False

    # A word occupying more than half of a sufficiently long segment is a
    # common Whisper failure mode on noise/music.
    if max(words.count(word) for word in set(words)) / len(words) > 0.5:
        return True

    # Detect a 2-5 word phrase repeated three times in a row.
    for width in range(2, min(6, len(words) // 3 + 1)):
        for start in range(0, len(words) - width * 3 + 1):
            phrase = words[start : start + width]
            if (
                words[start + width : start + width * 2] == phrase
                and words[start + width * 2 : start + width * 3] == phrase
            ):
                return True
    return False


def _accept_segment(segment) -> bool:
    text = _normalized_text(getattr(segment, "text", ""))
    if not text:
        return False

    folded = text.casefold()
    avg_logprob = float(getattr(segment, "avg_logprob", 0.0) or 0.0)
    no_speech_prob = float(getattr(segment, "no_speech_prob", 0.0) or 0.0)

    # Keep low-confidence speech: dropping it loses real words, especially
    # quiet Vietnamese speech and repeated insults.  Only discard a known
    # Whisper hallucination when the segment is also strongly marked as
    # non-speech; the confidence values are still returned to the caller.
    if no_speech_prob > 0.92 and avg_logprob < -1.2:
        if any(phrase in folded for phrase in HALLUCINATION_PHRASES):
            return False
    return True


def transcribe_vietnamese(model, audio_segment):
    """Return (text, accepted words, accepted segments, confidence_percent)."""
    waveform = get_whisper_waveform(audio_segment)
    if waveform.size == 0:
        return "", [], [], 0.0

    segments, _ = model.transcribe(
        waveform,
        language="vi",
        task="transcribe",
        beam_size=5,
        temperature=0.0,
        word_timestamps=True,
        # Process the complete ESP clip. Silero VAD was dropping quiet
        # Vietnamese speech even when the WAV was clearly audible.
        vad_filter=False,
        vad_parameters={
            "threshold": 0.20,
            "min_speech_duration_ms": 100,
            "min_silence_duration_ms": 300,
            "speech_pad_ms": 300,
        },
        condition_on_previous_text=True,
        no_speech_threshold=0.95,
        log_prob_threshold=-2.0,
        compression_ratio_threshold=3.0,
        repetition_penalty=1.0,
        hallucination_silence_threshold=1.0,
        initial_prompt=None,
    )

    accepted_segments = []
    words = []
    texts = []
    probabilities = []
    for segment in segments:
        if not _accept_segment(segment):
            continue
        text = _normalized_text(segment.text)
        texts.append(text)
        accepted_segments.append(segment)
        words.extend(getattr(segment, "words", None) or [])
        probabilities.append(math.exp(min(0.0, float(segment.avg_logprob))))

    transcript = " ".join(texts).strip()
    confidence = round(100.0 * sum(probabilities) / len(probabilities), 1) if probabilities else 0.0
    return transcript, words, accepted_segments, confidence
