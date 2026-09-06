import json
import sys
from pydub import AudioSegment
from faster_whisper import WhisperModel
from transcription import transcribe_vietnamese, censor_audio_and_text, DEFAULT_PROFANITY_WORDS

sys.stdout.reconfigure(encoding='utf-8')

model = WhisperModel('small', device='cpu', compute_type='int8')
audio = AudioSegment.from_file('/tai-lieu/ddc8a091cb6f44208854315046cec4d6.mp3')
transcript, words, segments, conf = transcribe_vietnamese(model, audio)
print('--- RAW TRANSCRIPT ---')
print(transcript)
print('\n--- ALL WORDS & TIMESTAMPS ---')
for w in words:
    st = getattr(w, 'start', 0.0)
    en = getattr(w, 'end', 0.0)
    txt = getattr(w, 'word', '')
    print(f"{st:5.2f}s - {en:5.2f}s : '{txt}'")

censored_audio, censored_text, intervals = censor_audio_and_text(audio, transcript, words, DEFAULT_PROFANITY_WORDS)
print('\n--- CENSORED INTERVALS (BEEPS) ---')
for start_ms, end_ms in intervals:
    print(f"{start_ms/1000.0:5.2f}s - {end_ms/1000.0:5.2f}s (duration: {(end_ms-start_ms)}ms)")

print('\n--- CENSORED TEXT ---')
print(censored_text)
