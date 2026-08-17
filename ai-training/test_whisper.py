import os
import sys
import glob
sys.stdout.reconfigure(encoding='utf-8')
from faster_whisper import WhisperModel
import numpy as np
from pydub import AudioSegment

def get_whisper_waveform(audio_segment: AudioSegment) -> np.ndarray:
    if audio_segment.frame_rate != 16000:
        audio_segment = audio_segment.set_frame_rate(16000)
    if audio_segment.channels != 1:
        audio_segment = audio_segment.set_channels(1)
    samples = np.array(audio_segment.get_array_of_samples())
    return samples.astype(np.float32) / 32768.0

print("Loading model...")
model = WhisperModel("large-v3", device="cpu", compute_type="int8")

# Find a test file from tai-lieu
files = glob.glob(r"C:\website\web\tai-lieu\*.m4a") + glob.glob(r"C:\website\web\tai-lieu\*.mp3")
if not files:
    print("No audio files found.")
    sys.exit(0)

test_file = files[0]
print(f"Testing on {test_file}")

audio = AudioSegment.from_file(test_file)
# Just test the first 10 seconds
chunk = audio[:10000]

waveform = get_whisper_waveform(chunk)
prompt = "Đây là đoạn hội thoại có nhiều tiếng chửi tục như: đụ má, địt mẹ, cái lồn, chó đẻ, cái địt con mẹ mày."

print("--- WITHOUT PROMPT ---")
segments, _ = model.transcribe(waveform, language="vi")
for s in segments:
    print(s.text)

print("--- WITH PROMPT ---")
segments, _ = model.transcribe(waveform, language="vi", initial_prompt=prompt)
for s in segments:
    print(s.text)
