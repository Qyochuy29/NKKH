import os
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Thêm đường dẫn FFMPEG vào PATH để pydub không bị lỗi WinError 2
ffmpeg_path = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin"
if ffmpeg_path not in os.environ["PATH"]:
    os.environ["PATH"] += os.pathsep + ffmpeg_path

import re
import uuid
import tempfile
import numpy as np
import tensorflow as tf
import tensorflow_hub as hub
import librosa
from pydub import AudioSegment
from pydub.generators import Sine
from pydub.silence import detect_nonsilent
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import unicodedata
import difflib

# ============================================================
# THƯ MỤC AUDIO ĐƯỢC PHÉP ĐỌC
# ============================================================
UPLOAD_DIR = os.path.abspath("../tai-lieu")
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE_MB = 20
CONFIDENCE_THRESHOLD = 0.55

PROFANITY_WORDS = [
    'địt', 'đụ', 'lồn', 'lôn', 'cặc', 'buồi', 'đĩ', 'phò', 'đéo', 'đm', 'đmm', 'vcl', 'vl', 'đcm',
    'địt mẹ', 'đờ mờ', 'dm', 'đmm', 'con mẹ mày', 'đb', 'đầu buồi', 'đầu cu',
    'cái lồn', 'con phò', 'điếm', 'đĩ', 'chó má', 'súc vật',
    'con cụ', 'tổ sư cha', 'mất dạy', 'con hoang', 'con chó', 'địt mẹ mày',
    'loại vô học', 'nhờn lồn', 'nhờn mặt', 'mặt lồn', 'rác rưởi', 'nứng',
    'hãm lồn', 'rẻ rách'
]

THREAT_PHRASES = [
    'thích chết', 'ăn đấm', 'chán sống', 'xanh cỏ',
    'câm cái mồm', 'nín ngay', 'vả vỡ mồm', 'sủa tiếp', 'tuổi lồn',
    'ngon thì', 'nhào vô', 'bước ra', 'đụng vào tao', 'sờ vào người',
    'gọi người', 'gọi hội', 'gọi anh em', 'bốc máy',
    'chém chết', 'xin tí huyết', 'đập gãy', 'phá nát', 'nhập viện',
    'biết nhà', 'coi chừng tao', 'gặp đâu đánh đó', 'bắt được',
]

THREAT_WEAK_WORDS = ['đánh', 'giết', 'chết', 'tát']

SAFE_COLLOCATIONS = [
    'đánh răng', 'đánh đàn', 'đánh giá', 'đánh máy', 'đánh cờ', 'đánh bóng',
    'chết máy', 'chết điện', 'chết wifi', 'chết mạng', 'tát nước',
]

EMERGENCY_WORDS = [
    'cứu tôi', 'giúp tôi', 'cứu em', 'cứu cháu', 'ối giời ơi', 'có ai không',
    'cứu', 'buông tao', 'thả tao', 'cướp', 'giết người', 'bỏ ra',
    'công an', 'bảo vệ', 'có dao', 'có súng', 'nó đâm',
    'cấp cứu', 'bệnh viện', 'xe thương', 'chảy máu', 'gãy xương', 'ngất',
    'đột quỵ', 'hộc máu', 'thở không được', 'ép tim',
    'cháy', 'nổ', 'sập', 'ngập', 'lụt', 'chìm', 'kẹt', 'ngạt khói',
    'phá cửa', 'xin tha', 'đừng đánh', 'tha cho em', 'tha cho tao', 'van xin', 'lạy lục'
]

app = Flask(__name__)

print("Đang tải bộ não AI YAMNet từ Google...")
try:
    yamnet_model_handle = 'https://tfhub.dev/google/yamnet/1'
    yamnet_model = hub.load(yamnet_model_handle)
    print("✅ Đã tải xong YAMNet!")
except Exception as e:
    print(f"⚠️ Lỗi tải YAMNet: {e}")

print("Đang tải Faster Whisper Model...")
try:
    whisper_model = WhisperModel("large-v3", device="cpu", compute_type="int8")
    print("✅ Đã tải xong WhisperModel!")
except Exception as e:
    print(f"⚠️ Lỗi tải Whisper: {e}")

def resolve_safe_path(filename: str):
    if not filename:
        return None
    safe_name = os.path.basename(filename)
    full_path = os.path.abspath(os.path.join(UPLOAD_DIR, safe_name))
    if not full_path.lower().startswith(UPLOAD_DIR.lower()):
        return None
    return full_path

def contains_word(text: str, phrase: str) -> bool:
    pattern = r'(?<!\w)' + re.escape(phrase) + r'(?!\w)'
    return re.search(pattern, text, flags=re.UNICODE) is not None

def detect_threat_weak_word(text: str, word: str) -> bool:
    if not contains_word(text, word):
        return False
    for safe in SAFE_COLLOCATIONS:
        if word in safe and contains_word(text, safe):
            return False
    return True

def analyze_transcript(transcript: str):
    lower_text = transcript.lower()
    has_vulgarity = any(contains_word(lower_text, w) for w in PROFANITY_WORDS) or '*' in lower_text
    is_threat = any(contains_word(lower_text, p) for p in THREAT_PHRASES)
    if not is_threat:
        weak_hits = sum(1 for w in THREAT_WEAK_WORDS if detect_threat_weak_word(lower_text, w))
        is_threat = weak_hits >= 2
    is_emergency = any(contains_word(lower_text, w) for w in EMERGENCY_WORDS)
    return has_vulgarity, is_threat, is_emergency

def get_whisper_waveform(audio_segment):
    audio = audio_segment.set_frame_rate(16000).set_channels(1)
    samples = np.array(audio.get_array_of_samples(), dtype=np.float32)
    max_val = float(2**(8 * audio.sample_width - 1))
    return samples / max_val

DANGEROUS_YAMNET_CLASSES = [10, 20, 22, 23, 26, 42, 43, 44, 461, 463]

def classify_audio(audio_data):
    try:
        if isinstance(audio_data, AudioSegment):
            waveform = get_whisper_waveform(audio_data)
        else:
            waveform = audio_data
            
        scores, embeddings, spectrogram = yamnet_model(waveform)
        scores_np = scores.numpy()
        max_scores = np.max(scores_np, axis=0)
        
        scream_score = 0.0
        for c in DANGEROUS_YAMNET_CLASSES:
            if max_scores[c] > scream_score:
                scream_score = max_scores[c]
                
        scream_timestamps = []
        for i, frame in enumerate(scores_np):
            if any(frame[c] > CONFIDENCE_THRESHOLD for c in DANGEROUS_YAMNET_CLASSES):
                scream_timestamps.append(i * 0.48)
                
        speech_score = max_scores[0]
        
        if scream_score > CONFIDENCE_THRESHOLD:
            return 'scream', float(scream_score), scream_timestamps
        else:
            if speech_score < 0.1:
                return 'unknown', float(speech_score), scream_timestamps
            return 'argument', float(speech_score), scream_timestamps
            
    except Exception as e:
        print(f"Lỗi YAMNet: {e}")
        return 'argument', 0.1, []

def decide_final_class(model_class_code, confidence, has_vulgarity, is_threat, is_emergency):
    mapped_class = model_class_code
    model_confident = confidence >= CONFIDENCE_THRESHOLD
    is_uncertain = False

    if is_emergency:
        final_class = 'help'
    elif is_threat:
        final_class = 'threat'
    elif mapped_class == 'scream' and model_confident:
        final_class = 'scream'
    elif has_vulgarity:
        final_class = 'argument'
    elif model_confident:
        final_class = mapped_class
    else:
        final_class = mapped_class
        is_uncertain = True

    return final_class, is_uncertain

def censor_audio_and_text(audio_chunk, censored_transcript, whisper_words):
    intervals_to_beep = []
    
    censored_transcript_nfc = unicodedata.normalize('NFC', censored_transcript)
    
    for p in PROFANITY_WORDS:
        p_nfc = unicodedata.normalize('NFC', p.lower())
        pattern = r'(?i)(?<![a-zA-Z0-9À-ỹ])' + re.escape(p_nfc) + r'(?![a-zA-Z0-9À-ỹ])'
        
        def match_and_beep(m):
            match_str = m.group(0)
            # Find which whisper_words overlap with this match to beep them out
            # Whisper words have text. We can find the approximate timestamp by matching substrings
            # But safer to just beep the whole interval of words that match
            return '***'
            
        censored_transcript_nfc = re.sub(pattern, match_and_beep, censored_transcript_nfc)

    # Let's use whisper_words to find the intervals to beep based on the PROFANITY_WORDS
    words_map = []
    for w in whisper_words:
        clean_w = unicodedata.normalize('NFC', re.sub(r'[^a-zA-Z0-9À-ỹ]', '', w.word.lower()))
        if clean_w:
            words_map.append({
                'word': clean_w,
                'orig_word': w.word.strip(),
                'start_time': w.start * 1000,
                'end_time': w.end * 1000
            })

    for p in [unicodedata.normalize('NFC', p.lower()) for p in PROFANITY_WORDS]:
        p_words = p.split()
        if len(p_words) == 0: continue
        for i in range(len(words_map) - len(p_words) + 1):
            window_words = [words_map[j]['word'] for j in range(i, i+len(p_words))]
            # Check if all words match exactly
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

@app.route('/analyze-dialog', methods=['POST'])
def analyze_dialog():
    pass

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True) or {}
    filename = data.get('filepath')

    if not filename:
        return jsonify({"error": "Missing filepath parameter"}), 400

    filepath = resolve_safe_path(filename)
    if filepath is None or not os.path.exists(filepath):
        return jsonify({"error": "Invalid filename or not found"}), 404

    try:
        audio = AudioSegment.from_file(filepath)
        predicted_class, confidence = classify_audio(audio)

        transcript = ""
        has_vulgarity = is_threat = is_emergency = False
        whisper_words = []

        try:
            waveform = get_whisper_waveform(audio)
            segments, _ = whisper_model.transcribe(waveform, language="vi", word_timestamps=True, vad_filter=True, vad_parameters=dict(min_silence_duration_ms=500))
            for segment in segments:
                transcript += segment.text
                whisper_words.extend(segment.words)
            
            # Censor first so fuzzy matching has a chance to place '***'
            if transcript:
                try:
                    audio, transcript = censor_audio_and_text(audio, transcript, whisper_words)
                    # Export immediately since we might have beeped the audio
                    audio.export(filepath, format="wav")
                except Exception as censor_err:
                    print(f"Censoring Error: {censor_err}")
            
            has_vulgarity, is_threat, is_emergency = analyze_transcript(transcript)
        except Exception as stt_err:
            print(f"STT Error: {stt_err}")

        final_class, is_uncertain = decide_final_class(
            predicted_class, confidence, has_vulgarity, is_threat, is_emergency
        )

        return jsonify({
            "status": "success",
            "soundType": final_class,
            "confidence": round(confidence * 100, 2),
            "is_uncertain": is_uncertain,
            "has_vulgarity": has_vulgarity,
            "is_threat": is_threat,
            "is_emergency": is_emergency,
            "transcript": transcript
        })
    except Exception as e:
        import traceback
        return jsonify({"error": str(e) + "\n" + traceback.format_exc()}), 500

@app.route('/analyze-full', methods=['POST'])
def analyze_full():
    data = request.get_json(silent=True) or {}
    filename = data.get('filepath')
    chunk_length_ms = data.get('chunk_length_ms', 10000)

    if not filename:
        return jsonify({"error": "Missing filepath parameter"}), 400

    filepath = resolve_safe_path(filename)
    if filepath is None or not os.path.exists(filepath):
        return jsonify({"error": "File not found or invalid path"}), 404

    try:
        audio = AudioSegment.from_file(filepath)
        total_duration_ms = len(audio)

        nonsilent_ranges = detect_nonsilent(audio, min_silence_len=500, silence_thresh=-40)
        if not nonsilent_ranges:
            nonsilent_ranges = [[0, len(audio)]]
            
        dialogue = []
        current_speaker = "Người A"
        last_end_time = 0
        last_end_time_audio = 0
        censored_full_audio = audio[:0]
        total_threats = 0
        total_vulgarity = 0
        total_emergency = 0
        has_scream = False
        
        predicted_class, conf, scream_timestamps = classify_audio(audio)
        if predicted_class == 'scream' and conf >= CONFIDENCE_THRESHOLD:
            has_scream = True
        
        for start, end in nonsilent_ranges:
            if start - last_end_time > 1000:
                current_speaker = "Người B" if current_speaker == "Người A" else "Người A"
                
            chunk = audio[start:end] + 5
            
            whisper_words = []
            transcript = ""
            try:
                waveform = get_whisper_waveform(chunk)
                prompt = "Đây là cuộc cãi vã có chửi bới: địt mẹ mày, cái lồn, chó đẻ, đụ má, con đĩ."
                segments, _ = whisper_model.transcribe(
                    waveform, 
                    language="vi", 
                    word_timestamps=True, 
                    vad_filter=True, 
                    vad_parameters=dict(min_silence_duration_ms=500),
                    initial_prompt=prompt
                )
                for segment in segments:
                    transcript += segment.text
                    whisper_words.extend(segment.words)
                
                censored_chunk, censored_transcript = censor_audio_and_text(audio[start:end], transcript, whisper_words)
                
                v, t, e = analyze_transcript(censored_transcript)
                if v: total_vulgarity += 1
                if t: total_threats += 1
                if e: total_emergency += 1
                
                if censored_transcript:
                    dialogue.append({
                        "speaker": current_speaker,
                        "text": censored_transcript,
                        "timestamp_s": round(start / 1000.0, 1),
                        "start_time": round(start / 1000.0, 1),
                        "end_time": round(end / 1000.0, 1),
                        "has_vulgarity": v,
                        "is_threat": t,
                        "is_emergency": e
                    })
            except Exception as e_stt:
                censored_chunk = audio[start:end]
            
            censored_full_audio += audio[last_end_time_audio:start]
            censored_full_audio += censored_chunk
            last_end_time_audio = end
            last_end_time = end

        censored_full_audio += audio[last_end_time_audio:]

        probability = 5 
        if has_scream: probability += 30
        if total_threats > 0: probability += 25 + (min(total_threats, 3) * 5)
        if total_vulgarity > 0: probability += 15 + (min(total_vulgarity, 3) * 5)
        if total_emergency > 0: probability += 40
        if len(set(d['speaker'] for d in dialogue)) > 1 and (total_vulgarity > 0 or total_threats > 0):
            probability += 10
            
        probability = min(probability, 98)
        if probability < 10 and not dialogue:
            probability = 0
            
        dialog_result = {
            "dialogue": dialogue,
            "violence_probability": probability,
            "has_scream": has_scream,
            "threats_count": total_threats,
            "vulgarity_count": total_vulgarity
        }

        alerts_found = []
        is_valid_alert = False
        final_class = 'argument'
        
        if probability >= 10 or has_scream or total_threats > 0 or total_emergency > 0 or total_vulgarity > 0:
            is_valid_alert = True
            if has_scream:
                final_class = 'scream'
            elif total_emergency > 0:
                final_class = 'help'
            elif total_threats > 0:
                final_class = 'threat'
                
        if is_valid_alert:
            problematic_dialogues = [d for d in dialogue if d.get('has_vulgarity') or d.get('is_threat') or d.get('is_emergency')]
            
            buckets = {}
            for t in scream_timestamps:
                b = int(t // 10)
                if b not in buckets: buckets[b] = set()
                buckets[b].add('scream')
                
            for pd in problematic_dialogues:
                center_s = (pd['start_time'] + pd['end_time']) / 2
                b = int(center_s // 10)
                if b not in buckets: buckets[b] = set()
                
                pd_type = 'argument'
                if pd.get('is_emergency'): pd_type = 'help'
                elif pd.get('is_threat'): pd_type = 'threat'
                elif has_scream: pd_type = 'scream'
                buckets[b].add(pd_type)
                
            if not buckets:
                buckets[0] = {final_class}
                
            for b, types in buckets.items():
                start_s = b * 10
                end_s = min(total_duration_ms / 1000, start_s + 10)
                
                bucket_type = 'argument'
                if 'help' in types: bucket_type = 'help'
                elif 'scream' in types: bucket_type = 'scream'
                elif 'threat' in types: bucket_type = 'threat'
                
                start_ms = int(start_s * 1000)
                end_ms = int(end_s * 1000)
                audio_snippet = censored_full_audio[start_ms:end_ms]
                
                alert_filename = f"alert_10s_{uuid.uuid4().hex[:8]}.wav"
                alert_filepath = os.path.join(UPLOAD_DIR, alert_filename)
                try:
                    audio_snippet.export(alert_filepath, format="wav")
                except Exception as e:
                    print(f"Lỗi khi export alert 10s audio: {e}")
                    
                bucket_transcripts = [d['text'] for d in dialogue if start_s <= d['start_time'] <= end_s or start_s <= d['end_time'] <= end_s]
                
                alerts_found.append({
                    "start_time_seconds": start_s,
                    "end_time_seconds": end_s,
                    "filename": alert_filename,
                    "soundType": bucket_type,
                    "confidence": probability,
                    "transcript": " ".join(bucket_transcripts) if bucket_transcripts else "",
                    "has_vulgarity": total_vulgarity > 0,
                    "is_threat": total_threats > 0,
                    "is_emergency": total_emergency > 0
                })
            
        return jsonify({
            "status": "success",
            "total_duration_seconds": total_duration_ms // 1000,
            "alerts_count": len(alerts_found),
            "alerts": alerts_found,
            "dialog_data": dialog_result
        })

    except Exception as e:
        import traceback
        return jsonify({"error": str(e) + "\n" + traceback.format_exc()}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)