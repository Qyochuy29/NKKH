import sys
from pydub import AudioSegment
from faster_whisper import WhisperModel
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

audio = AudioSegment.from_file('/tai-lieu/ddc8a091cb6f44208854315046cec4d6.mp3')
audio_10s = audio[:10000]

audio_mono = audio_10s.set_frame_rate(16000).set_channels(1)
samples = np.asarray(audio_mono.get_array_of_samples(), dtype=np.float32)
max_val = float(2 ** (8 * audio_mono.sample_width - 1))
waveform = samples / max_val
waveform = waveform - float(np.mean(waveform))
rms = float(np.sqrt(np.mean(np.square(waveform))))
gain = min(8.0, 0.12 / (rms + 1e-6))
waveform = np.clip(waveform * gain, -1.0, 1.0).astype(np.float32)

model = WhisperModel('small', device='cpu', compute_type='int8')

from transcription import VIETNAMESE_PROMPT

print("--- TEST WITH VAD=TRUE ---")
segments, _ = model.transcribe(
    waveform,
    language="vi",
    beam_size=5,
    best_of=5,
    temperature=0.0,
    vad_filter=True,
    vad_parameters={
        "threshold": 0.25,
        "min_speech_duration_ms": 100,
        "min_silence_duration_ms": 400,
        "speech_pad_ms": 250,
    },
    initial_prompt=VIETNAMESE_PROMPT,
    word_timestamps=True,
)
for seg in segments:
    print(f"[{seg.start:4.2f} - {seg.end:4.2f}] {seg.text}")

print("\n--- TEST WITH VAD=FALSE ---")
segments, _ = model.transcribe(
    waveform,
    language="vi",
    beam_size=5,
    best_of=5,
    temperature=0.0,
    vad_filter=False,
    initial_prompt=VIETNAMESE_PROMPT,
    word_timestamps=True,
)
for seg in segments:
    print(f"[{seg.start:4.2f} - {seg.end:4.2f}] {seg.text}")
