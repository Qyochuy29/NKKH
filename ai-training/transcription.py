"""Vietnamese speech-to-text and audio censoring helpers.

Prioritizes accuracy, correct tone marks, and precise word-level censoring (1000Hz beep)
over profanity words without altering the audio timing.
"""

from __future__ import annotations

import math
import os
import re
import unicodedata
from typing import List, Tuple, Dict, Any

import numpy as np
from pydub import AudioSegment
from pydub.generators import Sine


HALLUCINATION_PHRASES = (
    "subscribe",
    "đăng ký kênh",
    "theo dõi kênh",
    "cảm ơn các bạn đã xem",
    "hẹn gặp lại các bạn",
    "ghiền mì gõ",
    "like and share",
    "hãy like",
    "video sau",
    "chúc các bạn",
)

# Natural conversational prompt containing colloquial Vietnamese curses, threats, pleading, and sobbing
VIETNAMESE_PROMPT = (
    "Địt con mẹ mày, con mẹ mày, địt mẹ mày, bố mày nhờn với mày đấy à, "
    "câm mẹ cái mồm mày đi, tao đéo câm, tao đánh vỡ mồm mày ra rồi, tuổi lồn sánh vai, "
    "đánh chết mẹ mày, đồ chó đẻ, súc sinh súc vật, láo lồn, câm cái mồm lại, "
    "bố mày chào hỏi tử tế, mày thích đánh nhau à, "
    "cứu tôi với, có ai không cứu em với, tha cho em, em xin anh đừng đánh nữa mà, "
    "em lạy anh em biết lỗi rồi, đau quá mẹ ơi, buông em ra hu hu hu."
)

DEFAULT_PROFANITY_WORDS = [
    # Cụm dài (match ưu tiên trước)
    'cái địt con mẹ mày',
    'địt con mẹ mày',
    'đit con mẹ mày',
    'đjt con mẹ mày',
    'mịt con mẹ mày',
    'cái mịt con mẹ mày',
    'mình còn mẹ à mày',
    'địt cả lò nhà mày',
    'địt con bà mày',
    'địt mẹ cha mày',
    'câm mẹ cái mồm mày đi',
    'câm mẹ cái mồm',
    'câm mẹ cái mỏ',
    'câm mẹ mày mồm',
    'đánh vỡ mồm mày',
    'đập vỡ mồm mày',
    'vả vỡ mồm mày',
    'tuổi lồn sánh vai',
    'tuổi lôn sánh vai',
    'tuổi lôn xánh mày',
    'tuổi lôn xảnh bay',
    'nhờn lồn với tao',
    'tao đánh chết mẹ',
    'đánh chết mẹ mày',
    'đánh chết cha mày',
    'bố mày nhờn với mày',
    'bố mày nhợn với mày',
    'bố mày nhớt với mày',

    # Cụm 3 từ
    'địt con mẹ',
    'đit con mẹ',
    'địt mẹ mày',
    'đit mẹ mày',
    'mịt mẹ mày',
    'địt bố mày',
    'địt cụ mày',
    'địt bà mày',
    'địt cha mày',
    'cái địt mẹ',
    'cái mịt mẹ',
    'con mẹ mày',
    'đụ má mày',
    'đụ mẹ mày',
    'câm cái mồm',
    'câm mẹ mồm',
    'câm mẹ mỏ',
    'cái đầu buồi',
    'cần cặc gì',
    'con chó đẻ',
    'con chó chết',
    'đồ chó chết',
    'đồ súc vật',
    'đồ su vật',
    'loại súc vật',
    'loại su vật',
    'mùa xíu vật',
    'một xíu vật',
    'tổ sư cha',
    'tổ cha mày',
    'mả mẹ mày',
    'tiên sư mày',
    'thằng mặt lồn',
    'thằng mặt lôn',
    'con mặt lồn',
    'con mặt lôn',
    'nhờn với bố',
    'nhợn với bố',
    'nhờn với tao',
    'vỡ mồm mày',
    'chết mẹ mày',
    'chết cha mày',
    'tuổi lồn gì',
    'tuổi lôn gì',
    'tuổi cặc gì',
    'của tổ này',
    'cút mẹ mày',
    'biến mẹ mày',
    'tao lạy mày',
    'tao lại mày',

    # Cụm 2 từ
    'địt mẹ', 'đit mẹ', 'mịt mẹ',
    'địt cụ', 'đit cụ', 'mịt cụ',
    'địt mợ',
    'địt cha',
    'địt bà',
    'địt bố',
    'cái địt',
    'đụ má',
    'đụ mẹ',
    'mẹ mày',
    'bố mày',
    'mẹ kiếp',
    'đầu buồi',
    'lồn buồi',
    'cái lồn', 'cái lôn',
    'láu lồn', 'láu lôn',
    'láo lồn', 'láo lôn',
    'mặt lồn', 'mặt lôn',
    'hãm lồn', 'hãm lôn',
    'nhờn lồn',
    'tuổi lồn', 'tuổi lôn',
    'tuổi cặc',
    'đầu cặc',
    'cái cặc',
    'con cặc',
    'con buồi',
    'con phò',
    'con đĩ',
    'chó chết',
    'chó đẻ',
    'chó má',
    'súc sinh',
    'súc vật', 'su vật',
    'đồ ngu',
    'đồ chó',
    'vô học',
    'rẻ rách',
    'rác rưởi',
    'câm mồm',
    'câm họng',
    'câm miệng',
    'câm mẹ',
    'chết mẹ',
    'chết cha',
    'vỡ mồm',
    'đánh bỡi',
    'vê lờ',
    'vê cờ lờ',
    'đờ mờ',
    'con cụ',
    'thằng lồn', 'thằng lôn',
    'con lồn', 'con lôn',

    # Từ đơn tục tĩu
    'địt', 'đit', 'đjt', 'dit', 'djt',
    'đụ', 'du',
    'lồn', 'lon', 'lồz', 'loz', 'lôn',
    'cặc', 'kặc', 'cac', 'cặt',
    'buồi', 'buoi', 'bùi', 'buôi',
    'đĩ', 'di',
    'phò', 'pho',
    'đéo', 'deo', 'đek', 'đếch',
    'đm', 'đmm', 'đcm', 'dmm', 'dcm', 'dm',
    'vcl', 'vl', 'vcc', 'clm', 'clgt', 'vkl', 'vcll',
    'đb',
    'nứng', 'nung',
    'điếm',
]

PHONETIC_WORD_MAP = {
    'lôn': 'lồn',
    'lồz': 'lồn',
    'loz': 'lồn',
    'đit': 'địt',
    'đjt': 'địt',
    'dit': 'địt',
    'djt': 'địt',
    'buoi': 'buồi',
    'bùi': 'buồi',
    'buôi': 'buồi',
    'kặc': 'cặc',
    'cac': 'cặc',
    'cặt': 'cặc',
    'nhợn': 'nhờn',
    'nhớt': 'nhờn',
}

PHONETIC_REGEX_FIXES = [
    (r'(?i)\b(cái\s+)?mịt\s+con\s+mẹ\b', r'\1địt con mẹ'),
    (r'(?i)\bmịt\s+mẹ\b', 'địt mẹ'),
    (r'(?i)\bmịt\s+cụ\b', 'địt cụ'),
    (r'(?i)\bmình\s+còn\s+mẹ\s+à\s+mày\b', 'địt con mẹ mày'),
    (r'(?i)\bđit\b', 'địt'),
    (r'(?i)\bđjt\b', 'địt'),
    (r'(?i)\btuổi\s+lôn\s+(xánh|xảnh|sánh)\s+(mày|bay|vai)\b', 'tuổi lồn sánh vai'),
    (r'(?i)\btuổi\s+lôn\b', 'tuổi lồn'),
    (r'(?i)\bmặt\s+lôn\b', 'mặt lồn'),
    (r'(?i)\bhãm\s+lôn\b', 'hãm lồn'),
    (r'(?i)\bláo\s+lôn\b', 'láo lồn'),
    (r'(?i)\bcon\s+lôn\b', 'con lồn'),
    (r'(?i)\bthằng\s+lôn\b', 'thằng lồn'),
    (r'(?i)\bbố\s+mày\s+(nhợn|nhớt|nhận)\s+với\s+mày\b', 'bố mày nhờn với mày'),
    (r'(?i)\bnhợn\s+với\s+(tao|bố)\b', r'nhờn với \1'),
    (r'(?i)\b(đồ|con|loại|phật)\s+su\s+vật\b', r'đồ súc vật'),
    (r'(?i)\b(một|mùa)\s+xíu\s+vật\b', 'đồ súc vật'),
    (r'(?i)\btao\s+(lại|lạy)\s+(máy|mậy)\b', 'tao lạy mày'),
    (r'(?i)\bđánh\s+bỡi\b', 'đánh vỡ mồm'),
]


def correct_vietnamese_transcription(text: str) -> str:
    """Correct common Whisper Vietnamese mis-transcriptions for slang and curses."""
    text = unicodedata.normalize("NFC", text or "").strip()
    for pat, rep in PHONETIC_REGEX_FIXES:
        text = re.sub(pat, rep, text)
    return text


def get_whisper_waveform(audio_segment: AudioSegment) -> np.ndarray:
    """Convert any pydub AudioSegment to normalized 16 kHz mono float32 for Whisper."""
    audio = audio_segment.set_frame_rate(16000).set_channels(1)
    samples = np.asarray(audio.get_array_of_samples(), dtype=np.float32)
    if samples.size == 0:
        return samples
    max_value = float(2 ** (8 * audio.sample_width - 1))
    waveform = samples / max_value

    # DC offset removal
    waveform = waveform - float(np.mean(waveform))
    
    # Clean peak normalization without dynamic compression
    peak = float(np.max(np.abs(waveform)))
    if peak > 1e-4:
        if peak < 0.3:
            # Boost quiet recordings moderately
            gain = min(3.0, 0.85 / peak)
            waveform = waveform * gain
        elif peak > 0.95:
            waveform = waveform * (0.95 / peak)
            
    return np.clip(waveform, -1.0, 1.0).astype(np.float32)


def _normalized_text(text: str) -> str:
    text = unicodedata.normalize("NFC", text or "").strip()
    return re.sub(r"\s+", " ", text)


def _clean_word_for_matching(raw_word: str) -> str:
    """Remove punctuation, lowercase, and normalize phonetic typos for matching."""
    text = unicodedata.normalize("NFC", raw_word or "").lower()
    clean = re.sub(r"[^\w\s]", "", text).strip()
    return PHONETIC_WORD_MAP.get(clean, clean)


def _accept_segment(segment) -> bool:
    text = _normalized_text(getattr(segment, "text", ""))
    if not text:
        return False

    folded = text.casefold()
    avg_logprob = float(getattr(segment, "avg_logprob", 0.0) or 0.0)
    no_speech_prob = float(getattr(segment, "no_speech_prob", 0.0) or 0.0)

    # Discard known YouTube hallucinations if non-speech probability is elevated
    if any(phrase in folded for phrase in HALLUCINATION_PHRASES):
        if no_speech_prob > 0.6 or avg_logprob < -0.8:
            return False

    return True


def deduplicate_consecutive_phrases(text: str) -> str:
    """Remove consecutive duplicate phrases caused by Whisper decoder latching on trailing silence."""
    words = text.split()
    if len(words) < 6:
        return text
    for n in range(8, 2, -1):
        i = 0
        while i + 2 * n <= len(words):
            if words[i : i + n] == words[i + n : i + 2 * n]:
                words = words[: i + n] + words[i + 2 * n :]
            else:
                i += 1
    collapsed = " ".join(words)
    return re.sub(r'\b(\w+)(?:\s+\1){2,}\b', r'\1', collapsed, flags=re.UNICODE)


def transcribe_vietnamese(model, audio_segment: AudioSegment, vad_filter: bool = True):
    """Return (text, accepted words, accepted segments, confidence_percent)."""
    waveform = get_whisper_waveform(audio_segment)
    if waveform.size == 0:
        return "", [], [], 0.0

    segments, _ = model.transcribe(
        waveform,
        language="vi",
        task="transcribe",
        beam_size=5,
        best_of=5,
        temperature=0.0,
        word_timestamps=True,
        vad_filter=vad_filter,
        vad_parameters={
            "threshold": 0.35,
            "min_speech_duration_ms": 100,
            "min_silence_duration_ms": 500,
            "speech_pad_ms": 350,
        },
        condition_on_previous_text=False,
        no_speech_threshold=0.6,
        log_prob_threshold=-1.5,
        compression_ratio_threshold=2.4,
        repetition_penalty=1.05,
        hallucination_silence_threshold=1.5,
        initial_prompt=VIETNAMESE_PROMPT,
    )

    accepted_segments = []
    words = []
    texts = []
    probabilities = []
    for segment in segments:
        if not _accept_segment(segment):
            continue

        # Correct phonetic mishearings and deduplicate any decoder latching loops
        corrected_text = correct_vietnamese_transcription(segment.text)
        corrected_text = deduplicate_consecutive_phrases(corrected_text)
        segment.text = corrected_text

        text = _normalized_text(corrected_text)
        texts.append(text)
        accepted_segments.append(segment)

        seg_words = getattr(segment, "words", None) or []
        for w in seg_words:
            w.word = correct_vietnamese_transcription(getattr(w, "word", ""))
        words.extend(seg_words)
        probabilities.append(math.exp(min(0.0, float(segment.avg_logprob))))

    raw_transcript = " ".join(texts).strip()
    transcript = deduplicate_consecutive_phrases(raw_transcript)
    confidence = round(100.0 * sum(probabilities) / len(probabilities), 1) if probabilities else 0.0
    return transcript, words, accepted_segments, confidence


def censor_audio_and_text(
    audio_segment: AudioSegment,
    transcript: str,
    whisper_words: list,
    profanity_list: list = None,
    padding_ms: int = 90,
    beep_gain: float = -8.0,
) -> Tuple[AudioSegment, str, List[Tuple[int, int]]]:
    """Overlays 1000Hz Sine tone over profanity words in audio and replaces words with '***' in text.
    
    Returns:
        (censored_audio, censored_transcript, intervals_beeped)
    """
    if profanity_list is None:
        profanity_list = DEFAULT_PROFANITY_WORDS

    # Normalize profanity list
    normalized_profanity = [
        _clean_word_for_matching(p) for p in profanity_list if p.strip()
    ]
    # Sort profanity words by length descending so longer phrases match first
    normalized_profanity.sort(key=lambda x: len(x.split()), reverse=True)

    # 1. Text Censoring with regex
    censored_transcript = unicodedata.normalize("NFC", transcript)
    for p in profanity_list:
        if not p or not p.strip():
            continue
        pattern = r"(?i)(?<!\w)" + re.escape(p.strip()) + r"(?!\w)"
        censored_transcript = re.sub(pattern, "***", censored_transcript)

    # Also censor normalized profanity forms if not already replaced
    for p in normalized_profanity:
        if not p:
            continue
        pattern = r"(?i)(?<!\w)" + re.escape(p) + r"(?!\w)"
        censored_transcript = re.sub(pattern, "***", censored_transcript)

    # 2. Identify Word Timestamps for Beep Overlay
    words_map = []
    for w in whisper_words:
        raw = getattr(w, "word", "")
        clean_w = _clean_word_for_matching(raw)
        if not clean_w:
            continue
        start_ms = int(getattr(w, "start", 0.0) * 1000)
        end_ms = int(getattr(w, "end", 0.0) * 1000)

        tokens = clean_w.split()
        if len(tokens) > 1:
            # Distribute time if a single Whisper word segment contains multi-word text
            duration_per_token = (end_ms - start_ms) / len(tokens)
            for idx, tok in enumerate(tokens):
                words_map.append({
                    "clean": tok,
                    "start": int(start_ms + idx * duration_per_token),
                    "end": int(start_ms + (idx + 1) * duration_per_token),
                })
        else:
            words_map.append({
                "clean": clean_w,
                "start": max(0, start_ms),
                "end": max(0, end_ms),
            })

    total_duration = len(audio_segment)
    intervals_to_beep = []

    # Match single words and compound n-grams against profanity list
    num_words = len(words_map)
    for p in normalized_profanity:
        p_tokens = p.split()
        k = len(p_tokens)
        if k == 0:
            continue

        for i in range(num_words - k + 1):
            window_tokens = [words_map[i + j]["clean"] for j in range(k)]
            if window_tokens == p_tokens:
                # Add safety padding before and after the word to catch plosives/fricatives
                start_padded = max(0, words_map[i]["start"] - padding_ms)
                end_padded = min(total_duration, words_map[i + k - 1]["end"] + padding_ms)
                if end_padded > start_padded:
                    intervals_to_beep.append((start_padded, end_padded))

    if not intervals_to_beep or len(audio_segment) == 0:
        return audio_segment, censored_transcript, []

    # 3. Merge overlapping or very close intervals (within 100ms)
    intervals_to_beep.sort(key=lambda x: x[0])
    merged_intervals = [list(intervals_to_beep[0])]
    for current in intervals_to_beep[1:]:
        last = merged_intervals[-1]
        if current[0] <= last[1] + 100:
            last[1] = max(last[1], current[1])
        else:
            merged_intervals.append(list(current))

    # 4. Generate Clean 1000Hz Sine Beep & Overlay without altering audio timing
    target_rate = audio_segment.frame_rate
    target_channels = audio_segment.channels
    target_sample_width = audio_segment.sample_width

    result_audio = audio_segment
    for start_ms, end_ms in merged_intervals:
        beep_len = end_ms - start_ms
        if beep_len <= 0:
            continue

        # Generate standard 1000Hz censor tone matching exact sample rate, channels & sample width
        beep = (
            Sine(1000)
            .to_audio_segment(duration=beep_len, volume=beep_gain)
            .set_frame_rate(target_rate)
            .set_channels(target_channels)
            .set_sample_width(target_sample_width)
        )

        # Splice: replace the profane segment completely with the beep tone.
        # This completely erases the profanity speech while preserving exact length.
        result_audio = result_audio[:start_ms] + beep + result_audio[end_ms:]

    return result_audio, censored_transcript, [(m[0], m[1]) for m in merged_intervals]
