import sys
from pydub import AudioSegment
from faster_whisper import WhisperModel
import numpy as np

sys.stdout.reconfigure(encoding='utf-8')

audio = AudioSegment.from_file('/tai-lieu/ddc8a091cb6f44208854315046cec4d6.mp3')
# Extract first 10 seconds where the phrase occurs
audio_10s = audio[:10000]

# Normalized waveform
audio_mono = audio_10s.set_frame_rate(16000).set_channels(1)
samples = np.asarray(audio_mono.get_array_of_samples(), dtype=np.float32)
max_val = float(2 ** (8 * audio_mono.sample_width - 1))
waveform = samples / max_val
waveform = waveform - float(np.mean(waveform))
rms = float(np.sqrt(np.mean(np.square(waveform))))
gain = min(8.0, 0.12 / (rms + 1e-6))
waveform = np.clip(waveform * gain, -1.0, 1.0).astype(np.float32)

model = WhisperModel('small', device='cpu', compute_type='int8')

prompts_to_test = [
    # Baseline: no prompt
    None,
    # Current prompt
    "Hội thoại học sinh, tiếng Việt có dấu đầy đủ. địt mẹ mày, cái lồn, cặc, buồi, đĩ, chó má, vcl, đm, đéo.",
    # Explicit vulgar prompt including "địt con mẹ mày"
    "Địt con mẹ mày, địt mẹ mày, địt con mẹ, con mẹ mày, câm mồm, bố mày, tuổi lồn, lồn, cặc, buồi, đĩ, biến đi.",
    # Conversational aggressive prompt
    "Cãi nhau chửi bới: Địt con mẹ mày! Mày còn nhờn với tao à? Mày tuổi lồn sánh vai! Bố mày đánh chết mẹ mày bây giờ.",
    # Very focused prompt with repetition of vulgar patterns
    "địt con mẹ mày địt mẹ mày đụ má cặc lồn buồi đĩ mẹ mày chó đẻ bố mày câm mồm",
]

for idx, p in enumerate(prompts_to_test):
    print(f"\n================ PROMPT {idx} ================")
    print(f"Prompt text: {p}")
    segments, _ = model.transcribe(
        waveform,
        language="vi",
        beam_size=5,
        best_of=5,
        temperature=0.0,
        condition_on_previous_text=False,
        initial_prompt=p,
        word_timestamps=True,
    )
    for seg in segments:
        print(f"[{seg.start:4.2f} - {seg.end:4.2f}] {seg.text}")
        words = getattr(seg, 'words', []) or []
        print("   Words:", [w.word for w in words])
