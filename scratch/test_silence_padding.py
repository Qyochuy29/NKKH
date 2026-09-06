import sys
from pydub import AudioSegment
from faster_whisper import WhisperModel
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

audio = AudioSegment.from_file('/tai-lieu/ddc8a091cb6f44208854315046cec4d6.mp3')

audio_mono = audio.set_frame_rate(16000).set_channels(1)
samples = np.asarray(audio_mono.get_array_of_samples(), dtype=np.float32)
max_val = float(2 ** (8 * audio_mono.sample_width - 1))
waveform = samples / max_val
waveform = waveform - float(np.mean(waveform))
rms = float(np.sqrt(np.mean(np.square(waveform))))
gain = min(8.0, 0.12 / (rms + 1e-6))
waveform = np.clip(waveform * gain, -1.0, 1.0).astype(np.float32)

# Prepend 0.5s of silence so VAD has room for speech_pad_ms at time 0
PAD_SEC = 0.5
pad_samples = np.zeros(int(16000 * PAD_SEC), dtype=np.float32)
waveform_padded = np.concatenate([pad_samples, waveform])

model = WhisperModel('small', device='cpu', compute_type='int8')

PROMPT_SUPER = (
    "Hội thoại bạo lực, cãi nhau gay gắt, chửi bới xúc phạm, đe dọa đánh nhau tiếng Việt có dấu: "
    "Địt con mẹ mày! Địt mẹ mày! Con mẹ mày! Cái địt con mẹ mày! Bố mày, mẹ mày, tuổi lồn sánh vai! "
    "Bố mày nhờn với mày đấy à? Mày có câm mẹ cái mồm mày đi không? Tao đánh vỡ mồm mày ra rồi! "
    "Mày có câm mồm không? Tao đánh chết mẹ mày bây giờ! Láu lồn, láo lồn, mặt lồn! "
    "Cần cặc gì, đầu buồi, lồn buồi, đĩ, chó má, vcl, đm, đéo, biến đi. "
    "Cứu tôi với, đừng đánh nữa, tha cho em!"
)


print("=== TEST WITH 0.5s PAD & VAD=TRUE ===")
segments, _ = model.transcribe(
    waveform_padded,
    language="vi",
    beam_size=5,
    best_of=5,
    temperature=0.0,
    vad_filter=True,
    vad_parameters={
        "threshold": 0.2,
        "min_speech_duration_ms": 80,
        "min_silence_duration_ms": 400,
        "speech_pad_ms": 300,
    },
    repetition_penalty=1.15,
    condition_on_previous_text=False,
    initial_prompt=PROMPT_SUPER,
    word_timestamps=True,
)

for seg in segments:
    adj_start = max(0.0, seg.start - PAD_SEC)
    adj_end = max(0.0, seg.end - PAD_SEC)
    print(f"[{adj_start:5.2f} - {adj_end:5.2f}] {seg.text}")
    words = getattr(seg, 'words', []) or []
    word_strs = [f"{w.word}({max(0.0, w.start - PAD_SEC):.2f}-{max(0.0, w.end - PAD_SEC):.2f})" for w in words]
    print("   ", " ".join(word_strs))
