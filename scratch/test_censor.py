import sys
import os
import site
for sp in site.getsitepackages() + [site.getusersitepackages()]:
    for module in ["cublas", "cudnn", "cuda_nvrtc"]:
        dll_path = os.path.join(sp, "nvidia", module, "bin")
        if os.path.exists(dll_path):
            os.add_dll_directory(dll_path)
sys.stdout.reconfigure(encoding='utf-8')
ffmpeg_path = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin"
if ffmpeg_path not in os.environ["PATH"]:
    os.environ["PATH"] += os.pathsep + ffmpeg_path

import unicodedata
import re
from pydub import AudioSegment
from pydub.generators import Sine

PROFANITY_WORDS = [
    'địt', 'đụ', 'lồn', 'lôn', 'cặc', 'buồi', 'đĩ', 'phò', 'đéo', 'đm', 'đmm', 'vcl', 'vl', 'đcm',
    'địt mẹ', 'đờ mờ', 'dm', 'đmm', 'con mẹ mày', 'đb', 'đầu buồi', 'đầu cu',
    'cái lồn', 'con phò', 'điếm', 'đĩ', 'chó má', 'súc vật',
    'con cụ', 'tổ sư cha', 'mất dạy', 'con hoang', 'con chó', 'địt mẹ mày',
    'loại vô học', 'nhờn lồn', 'nhờn mặt', 'mặt lồn', 'rác rưởi', 'nứng',
    'hãm lồn', 'rẻ rách'
]

def censor_audio_and_text(audio_chunk, censored_transcript, whisper_words):
    intervals_to_beep = []
    
    censored_transcript_nfc = unicodedata.normalize('NFC', censored_transcript)
    
    for p in PROFANITY_WORDS:
        p_nfc = unicodedata.normalize('NFC', p.lower())
        pattern = r'(?i)(?<![a-zA-Z0-9À-ỹ])' + re.escape(p_nfc) + r'(?![a-zA-Z0-9À-ỹ])'
        
        def match_and_beep(m):
            return '***'
            
        censored_transcript_nfc = re.sub(pattern, match_and_beep, censored_transcript_nfc)

    words_map = []
    for w in whisper_words:
        clean_w = unicodedata.normalize('NFC', re.sub(r'[^a-zA-Z0-9À-ỹ]', '', w['word'].lower()))
        if clean_w:
            words_map.append({
                'word': clean_w,
                'orig_word': w['word'].strip(),
                'start_time': w['start'] * 1000,
                'end_time': w['end'] * 1000
            })

    for p in [unicodedata.normalize('NFC', p.lower()) for p in PROFANITY_WORDS]:
        p_words = p.split()
        if len(p_words) == 0: continue
        for i in range(len(words_map) - len(p_words) + 1):
            window_words = [words_map[j]['word'] for j in range(i, i+len(p_words))]
            if window_words == p_words:
                start_ms = max(0, words_map[i]['start_time'] - 150)
                end_ms = min(len(audio_chunk), words_map[i + len(p_words) - 1]['end_time'] + 150)
                intervals_to_beep.append((start_ms, end_ms))

    censored_transcript = censored_transcript_nfc
    
    if intervals_to_beep:
        intervals_to_beep.sort()
        merged = [intervals_to_beep[0]]
        for current in intervals_to_beep[1:]:
            last = merged[-1]
            if current[0] <= last[1]:
                merged[-1] = (last[0], max(last[1], current[1]))
            else:
                merged.append(current)

        result_audio = audio_chunk[:0]
        last_end = 0
        for start_ms, end_ms in merged:
            start_ms = int(start_ms)
            end_ms = int(end_ms)
            result_audio += audio_chunk[last_end:start_ms]
            beep_duration = end_ms - start_ms
            if beep_duration > 0:
                beep = Sine(1000).to_audio_segment(duration=beep_duration).apply_gain(-10)
                result_audio += beep
            last_end = end_ms
        result_audio += audio_chunk[last_end:]
        return result_audio, censored_transcript
    return audio_chunk, censored_transcript

audio = Sine(440).to_audio_segment(duration=5000)
transcript = "tao đánh mày địt mẹ"
whisper_words = [
    {'word': 'tao', 'start': 0.1, 'end': 0.5},
    {'word': 'đánh', 'start': 0.6, 'end': 1.0},
    {'word': 'mày', 'start': 1.1, 'end': 1.5},
    {'word': 'địt', 'start': 1.6, 'end': 2.0},
    {'word': 'mẹ', 'start': 2.1, 'end': 2.5},
]
try:
    a, t = censor_audio_and_text(audio, transcript, whisper_words)
    print("SUCCESS")
    print("Transcript:", t)
except Exception as e:
    print("ERROR:", e)
