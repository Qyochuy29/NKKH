import os
import sys
import site

# Fix: Tự động nạp thư viện DLL của NVIDIA từ pip packages cho Windows
if hasattr(os, "add_dll_directory"):
    for sp in site.getsitepackages() + [site.getusersitepackages()]:
        for module in ["cublas", "cudnn", "cuda_nvrtc"]:
            dll_path = os.path.join(sp, "nvidia", module, "bin")
            if os.path.exists(dll_path):
                try:
                    os.add_dll_directory(dll_path)
                except Exception:
                    pass

sys.stdout.reconfigure(encoding='utf-8')

# Thêm đường dẫn FFMPEG vào PATH nếu có trên Windows
ffmpeg_path = r"C:\Users\admin\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin"
if os.path.exists(ffmpeg_path) and ffmpeg_path not in os.environ.get("PATH", ""):
    os.environ["PATH"] += os.pathsep + ffmpeg_path

import re
import uuid
import tempfile
import numpy as np
import tensorflow as tf

gpus = tf.config.experimental.list_physical_devices('GPU')
if gpus:
    try:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)
    except RuntimeError as e:
        print(e)

import tensorflow_hub as hub
import librosa
from pydub import AudioSegment
from flask import Flask, request, jsonify
from faster_whisper import WhisperModel
import unicodedata

# Import các helper đã được tối ưu hóa chuẩn xác cho tiếng Việt
from transcription import (
    get_whisper_waveform,
    transcribe_vietnamese,
    censor_audio_and_text,
    DEFAULT_PROFANITY_WORDS,
)

# ============================================================
# THƯ MỤC AUDIO ĐƯỢC PHÉP ĐỌC
# ============================================================
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", os.path.abspath("../tai-lieu"))
os.makedirs(UPLOAD_DIR, exist_ok=True)
MAX_FILE_SIZE_MB = 20
CONFIDENCE_THRESHOLD = 0.55

PROFANITY_WORDS = DEFAULT_PROFANITY_WORDS

THREAT_PHRASES = [
    'thích chết', 'ăn đấm', 'chán sống', 'xanh cỏ',
    'câm cái mồm', 'câm mồm', 'câm họng', 'nín ngay', 'vả vỡ mồm', 'sủa tiếp', 'tuổi lồn',
    'đánh vỡ mồm', 'đập vỡ mồm', 'vỡ mồm', 'đánh chết', 'chết mẹ mày', 'chết cha mày',
    'nhờn với mày', 'nhờn với bố', 'nhờn với tao', 'nhợn với', 'tuổi lồn sánh vai',
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
    # Kêu cứu khẩn cấp
    'cứu tôi', 'giúp tôi', 'cứu em', 'cứu cháu', 'cứu con', 'cứu tao', 'cứu với', 'có ai không',
    'cứu', 'buông tao', 'thả tao', 'buông em', 'thả em', 'bỏ em ra', 'buông ra', 'thả ra', 'bỏ tao ra',
    'cướp', 'giết người', 'bỏ ra', 'công an', 'bảo vệ', 'có dao', 'có súng', 'nó đâm',
    'cấp cứu', 'bệnh viện', 'xe thương', 'chảy máu', 'gãy xương', 'ngất',
    'đột quỵ', 'hộc máu', 'thở không được', 'ép tim',
    'cháy', 'nổ', 'sập', 'ngập', 'lụt', 'chìm', 'kẹt', 'ngạt khói', 'phá cửa',

    # Van xin & Lạy lục (Học đường / Nạn nhân bị bạo hành)
    'em xin anh', 'em xin chị', 'cháu xin chú', 'cháu xin cô', 'con xin ba', 'con xin mẹ', 'con xin bố',
    'con lạy ba', 'con lạy mẹ', 'con lạy bố', 'em lạy anh', 'em lạy chị', 'lạy anh', 'lạy chị', 'lạy mày',
    'tha cho em', 'tha cho con', 'tha cho cháu', 'tha cho mình', 'tha cho tôi', 'tha cho tao',
    'tha em đi', 'tha cho em đi', 'tha con đi', 'tha cháu đi', 'tha em lần này', 'tha cho một lần',
    'xin tha', 'xin tha mạng', 'tha mạng', 'van xin', 'lạy lục', 'cho em xin', 'cho con xin', 'làm ơn',
    'đừng đánh', 'đừng đánh em', 'đừng đánh con', 'đừng đánh cháu', 'đừng đánh nữa', 'đừng đánh tao',
    'đừng đập em', 'đừng tát em', 'đừng đá em', 'đừng bắt nạt em', 'đừng ép em', 'đừng kéo tóc',
    'đừng mà', 'xin đừng', 'đau quá', 'đau em', 'đau em quá', 'đau con quá', 'đau quá mẹ ơi', 'đau quá anh ơi',
    'em có làm gì đâu', 'sao lại đánh em', 'em biết lỗi rồi', 'con biết lỗi rồi', 'em xin lỗi', 'em xin lỗi mà', 'xin lỗi mà',
    'mẹ ơi', 'cứu con với', 'bố ơi', 'ba ơi', 'chết mất', 'tha lỗi',

    # Từ tượng thanh tiếng khóc & la hét
    'hu hu', 'huhu', 'hức hức', 'hic hic', 'oa oa', 'á á', 'á á á', 'ối giời ơi', 'ối mẹ ơi', 'ối ba ơi'
]

app = Flask(__name__)

print("Đang tải bộ não AI YAMNet từ Google...")
try:
    yamnet_model_handle = 'https://tfhub.dev/google/yamnet/1'
    yamnet_model = hub.load(yamnet_model_handle)
    print("✅ Đã tải xong YAMNet!")
except Exception as e:
    print(f"⚠️ Lỗi tải YAMNet: {e}")

whisper_model_size = os.environ.get("WHISPER_MODEL_SIZE", "small")
whisper_model = None
print(f"Đang tải Faster Whisper Model ({whisper_model_size})...")
try:
    whisper_model = WhisperModel(whisper_model_size, device="cuda", compute_type="int8_float16")
    print(f"✅ Đã tải xong WhisperModel ({whisper_model_size}) trên CUDA!")
except Exception as e:
    print(f"ℹ️ Không dùng CUDA ({e}), tự động chuyển sang CPU...")
    try:
        whisper_model = WhisperModel(whisper_model_size, device="cpu", compute_type="int8")
        print(f"✅ Đã tải xong WhisperModel ({whisper_model_size}) trên CPU!")
    except Exception as e_cpu:
        print(f"⚠️ Lỗi tải WhisperModel {whisper_model_size} trên CPU: {e_cpu}")
        try:
            whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            print("✅ Đã tải fallback WhisperModel (base) trên CPU!")
        except Exception as e_base:
            print(f"❌ Không thể tải WhisperModel: {e_base}")

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
    has_vulgarity = any(contains_word(lower_text, w) for w in PROFANITY_WORDS) or '***' in lower_text or '*' in lower_text
    is_threat = any(contains_word(lower_text, p) for p in THREAT_PHRASES)
    if not is_threat:
        weak_hits = sum(1 for w in THREAT_WEAK_WORDS if detect_threat_weak_word(lower_text, w))
        is_threat = weak_hits >= 2
    is_emergency = any(contains_word(lower_text, w) for w in EMERGENCY_WORDS)
    return has_vulgarity, is_threat, is_emergency

import subprocess

def save_censored_audio(censored_audio, filepath):
    ext = os.path.splitext(filepath)[1].lstrip('.').lower()
    if ext in ['mp4', 'webm', 'mkv', 'mov', 'avi']:
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tf:
            temp_wav = tf.name
        temp_out = filepath + ".tmp." + ext
        try:
            censored_audio.export(temp_wav, format="wav")
            cmd = [
                "ffmpeg", "-y",
                "-i", filepath,
                "-i", temp_wav,
                "-c:v", "copy",
                "-map", "0:v:0?",
                "-map", "1:a:0",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                temp_out
            ]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode == 0 and os.path.exists(temp_out) and os.path.getsize(temp_out) > 0:
                os.replace(temp_out, filepath)
            else:
                censored_audio.export(filepath, format="mp3")
        except Exception as err:
            print(f"Lỗi khi thay audio cho video bằng ffmpeg: {err}")
        finally:
            if os.path.exists(temp_wav):
                try: os.remove(temp_wav)
                except Exception: pass
            if os.path.exists(temp_out):
                try: os.remove(temp_out)
                except Exception: pass
    else:
        fmt = ext if ext in ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'] else 'mp3'
        censored_audio.export(filepath, format=fmt)


# ============================================================
# CẤU HÌNH NHÃN YAMNET CHUẨN XÁC TỪ GOOGLE AUDIOSET
# ============================================================
# Nhóm Gào thét / La hét
YAMNET_SCREAM_CLASSES = [
    6,   # Shout
    7,   # Bellow
    9,   # Yell
    10,  # Children shouting
    11,  # Screaming (Gào thét chuẩn)
]

# Nhóm Khóc lóc / Nức nở / Rên rỉ
YAMNET_CRY_CLASSES = [
    19,  # Crying, sobbing (Khóc nức nở chuẩn)
    20,  # Baby cry, infant cry
    21,  # Whimper (Thút thít)
    22,  # Wail, moan (Kêu khóc, rên rỉ)
    33,  # Groan (Rên rỉ đau đớn)
    39,  # Gasp (Thở dốc / hoảng loạn)
]

# Nhóm Va đập / Đập phá
YAMNET_IMPACT_CLASSES = [
    460, # Bang
    461, # Slap, smack (Cú tát)
    462, # Whack, thwack (Cú đánh mạnh)
    463, # Smash, crash (Đập phá)
    464, # Breaking (Gãy vỡ)
]

DANGEROUS_YAMNET_CLASSES = YAMNET_SCREAM_CLASSES + YAMNET_CRY_CLASSES + YAMNET_IMPACT_CLASSES

def classify_audio(audio_data):
    try:
        if isinstance(audio_data, AudioSegment):
            waveform = get_whisper_waveform(audio_data)
        else:
            waveform = audio_data
            
        scores, embeddings, spectrogram = yamnet_model(waveform)
        scores_np = scores.numpy()
        max_scores = np.max(scores_np, axis=0)
        
        scream_score = float(max(max_scores[c] for c in YAMNET_SCREAM_CLASSES))
        cry_score = float(max(max_scores[c] for c in YAMNET_CRY_CLASSES))
        impact_score = float(max(max_scores[c] for c in YAMNET_IMPACT_CLASSES))
        speech_score = float(max_scores[0])
        
        scream_timestamps = []
        cry_timestamps = []
        for i, frame in enumerate(scores_np):
            t = round(i * 0.48, 2)
            if any(frame[c] >= 0.25 for c in YAMNET_SCREAM_CLASSES):
                scream_timestamps.append(t)
            if any(frame[c] >= 0.18 for c in YAMNET_CRY_CLASSES):
                cry_timestamps.append(t)
                
        # Tiếng khóc thường có biên độ nhẹ hơn tiếng hét, ngưỡng 0.18 rất nhạy
        if cry_score >= 0.18 and cry_score >= scream_score:
            return 'crying', cry_score, cry_timestamps, scream_timestamps
        elif scream_score >= 0.25:
            return 'scream', scream_score, cry_timestamps, scream_timestamps
        elif impact_score >= 0.30:
            return 'impact', impact_score, cry_timestamps, scream_timestamps
        else:
            if speech_score < 0.1:
                return 'unknown', speech_score, cry_timestamps, scream_timestamps
            return 'argument', speech_score, cry_timestamps, scream_timestamps
            
    except Exception as e:
        print(f"Lỗi YAMNet: {e}")
        return 'argument', 0.1, [], []

def decide_final_class(model_class_code, confidence, has_vulgarity, is_threat, is_emergency):
    mapped_class = model_class_code
    model_confident = confidence >= CONFIDENCE_THRESHOLD
    is_uncertain = False

    if is_emergency or mapped_class == 'crying':
        final_class = 'help'
    elif is_threat or mapped_class == 'impact':
        final_class = 'threat'
    elif mapped_class == 'scream' and confidence >= 0.25:
        final_class = 'scream'
    elif has_vulgarity:
        final_class = 'argument'
    elif model_confident:
        final_class = mapped_class
    else:
        final_class = mapped_class
        is_uncertain = True

    return final_class, is_uncertain


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
        predicted_class, confidence, _, _ = classify_audio(audio)

        transcript, whisper_words, segments, confidence_stt = transcribe_vietnamese(
            whisper_model, audio, vad_filter=True
        )

        censored_audio, censored_transcript, beep_intervals = censor_audio_and_text(
            audio, transcript, whisper_words, profanity_list=PROFANITY_WORDS
        )

        # Ghi đè file audio bằng phiên bản đã đè tiếng bíp nếu phát hiện chửi thề
        if beep_intervals:
            try:
                save_censored_audio(censored_audio, filepath)
            except Exception as censor_err:
                print(f"Censoring Export Error: {censor_err}")

        has_vulgarity, is_threat, is_emergency = analyze_transcript(censored_transcript)

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
            "transcript": censored_transcript
        })
    except Exception as e:
        import traceback
        return jsonify({"error": str(e) + "\n" + traceback.format_exc()}), 500


@app.route('/analyze-dialog', methods=['POST'])
def analyze_dialog():
    data = request.get_json(silent=True) or {}
    filename = data.get('filepath')

    if not filename:
        return jsonify({"error": "Missing filepath parameter"}), 400

    filepath = resolve_safe_path(filename)
    if filepath is None or not os.path.exists(filepath):
        return jsonify({"error": "File not found or invalid path"}), 404

    try:
        audio = AudioSegment.from_file(filepath)
        total_duration_ms = len(audio)

        predicted_class, conf, cry_timestamps, scream_timestamps = classify_audio(audio)
        has_scream = (predicted_class == 'scream' and conf >= 0.25) or (len(scream_timestamps) > 0)
        has_crying = (predicted_class == 'crying' and conf >= 0.18) or (len(cry_timestamps) > 0)

        transcript, whisper_words, segments, confidence_stt = transcribe_vietnamese(
            whisper_model, audio, vad_filter=True
        )

        censored_audio, censored_transcript, beep_intervals = censor_audio_and_text(
            audio, transcript, whisper_words, profanity_list=PROFANITY_WORDS
        )

        if beep_intervals:
            try:
                save_censored_audio(censored_audio, filepath)
            except Exception as exp_err:
                print(f"Lỗi khi export: {exp_err}")

        dialogue = []
        current_speaker = "Người A"
        last_seg_end = 0.0
        total_threats = 0
        total_vulgarity = 0
        total_emergency = 0

        for seg in segments:
            if last_seg_end > 0 and (seg.start - last_seg_end) > 1.0:
                current_speaker = "Người B" if current_speaker == "Người A" else "Người A"

            _, seg_censored_text, _ = censor_audio_and_text(
                audio[:0], seg.text, getattr(seg, "words", []) or [], profanity_list=PROFANITY_WORDS
            )
            v, t, e = analyze_transcript(seg_censored_text)
            if v: total_vulgarity += 1
            if t: total_threats += 1
            if e: total_emergency += 1

            dialogue.append({
                "speaker": current_speaker,
                "text": seg_censored_text,
                "timestamp_s": round(seg.start, 1),
                "start_time": round(seg.start, 1),
                "end_time": round(seg.end, 1),
                "has_vulgarity": v,
                "is_threat": t,
                "is_emergency": e,
            })
            last_seg_end = seg.end

        probability = 5
        if has_scream: probability += 35
        if has_crying: probability += 35
        if total_emergency > 0: probability += 40 + (min(total_emergency, 3) * 5)
        if total_threats > 0: probability += 25 + (min(total_threats, 3) * 5)
        if total_vulgarity > 0: probability += 15 + (min(total_vulgarity, 3) * 5)
        if len(set(d['speaker'] for d in dialogue)) > 1 and (total_vulgarity > 0 or total_threats > 0 or total_emergency > 0):
            probability += 10

        probability = min(probability, 99)
        if probability < 10 and not dialogue and not has_scream and not has_crying:
            probability = 0

        dialog_result = {
            "dialogue": dialogue,
            "violence_probability": probability,
            "has_scream": has_scream,
            "has_crying": has_crying,
            "threats_count": total_threats,
            "vulgarity_count": total_vulgarity,
            "emergency_count": total_emergency
        }
        return jsonify(dialog_result)

    except Exception as e:
        import traceback
        return jsonify({"error": str(e) + "\n" + traceback.format_exc()}), 500


@app.route('/analyze-full', methods=['POST'])
def analyze_full():
    data = request.get_json(silent=True) or {}
    filename = data.get('filepath')

    if not filename:
        return jsonify({"error": "Missing filepath parameter"}), 400

    filepath = resolve_safe_path(filename)
    if filepath is None or not os.path.exists(filepath):
        return jsonify({"error": "File not found or invalid path"}), 404

    try:
        audio = AudioSegment.from_file(filepath)
        total_duration_ms = len(audio)

        # 1. Nhận diện sự kiện âm thanh bằng YAMNet (gào thét, khóc lóc, va đập)
        predicted_class, conf, cry_timestamps, scream_timestamps = classify_audio(audio)
        has_scream = (predicted_class == 'scream' and conf >= 0.25) or (len(scream_timestamps) > 0)
        has_crying = (predicted_class == 'crying' and conf >= 0.18) or (len(cry_timestamps) > 0)

        # 2. Nhận diện giọng nói tiếng Việt tối ưu bằng Faster-Whisper
        transcript, whisper_words, segments, confidence_stt = transcribe_vietnamese(
            whisper_model, audio, vad_filter=True
        )

        # 3. Kiểm duyệt âm thanh (đè tiếng bíp 1000Hz) & văn bản (thay bằng ***)
        censored_audio, censored_transcript, beep_intervals = censor_audio_and_text(
            audio, transcript, whisper_words, profanity_list=PROFANITY_WORDS
        )

        # Ghi đè file audio gốc trong tai-lieu bằng phiên bản đã chèn tiếng bíp
        if beep_intervals:
            try:
                save_censored_audio(censored_audio, filepath)
            except Exception as exp_err:
                print(f"Lỗi khi ghi đè file audio đã kiểm duyệt: {exp_err}")

        # 4. Phân tích đối thoại theo từng câu & người nói
        dialogue = []
        current_speaker = "Người A"
        last_seg_end = 0.0
        total_threats = 0
        total_vulgarity = 0
        total_emergency = 0

        for seg in segments:
            if last_seg_end > 0 and (seg.start - last_seg_end) > 1.0:
                current_speaker = "Người B" if current_speaker == "Người A" else "Người A"

            _, seg_censored_text, _ = censor_audio_and_text(
                audio[:0], seg.text, getattr(seg, "words", []) or [], profanity_list=PROFANITY_WORDS
            )
            v, t, e = analyze_transcript(seg_censored_text)
            if v: total_vulgarity += 1
            if t: total_threats += 1
            if e: total_emergency += 1

            dialogue.append({
                "speaker": current_speaker,
                "text": seg_censored_text,
                "timestamp_s": round(seg.start, 1),
                "start_time": round(seg.start, 1),
                "end_time": round(seg.end, 1),
                "has_vulgarity": v,
                "is_threat": t,
                "is_emergency": e,
            })
            last_seg_end = seg.end

        # Tính toán xác suất bạo lực (violence probability)
        probability = 5 
        if has_scream: probability += 35
        if has_crying: probability += 35
        if total_emergency > 0: probability += 40 + (min(total_emergency, 3) * 5)
        if total_threats > 0: probability += 25 + (min(total_threats, 3) * 5)
        if total_vulgarity > 0: probability += 15 + (min(total_vulgarity, 3) * 5)
        if len(set(d['speaker'] for d in dialogue)) > 1 and (total_vulgarity > 0 or total_threats > 0 or total_emergency > 0):
            probability += 10
            
        probability = min(probability, 99)
        if probability < 10 and not dialogue and not has_scream and not has_crying:
            probability = 0
            
        dialog_result = {
            "dialogue": dialogue,
            "violence_probability": probability,
            "has_scream": has_scream,
            "has_crying": has_crying,
            "threats_count": total_threats,
            "vulgarity_count": total_vulgarity,
            "emergency_count": total_emergency
        }

        # 5. Xuất các đoạn clip cảnh báo 10 giây (cũng được lấy từ censored_audio)
        alerts_found = []
        is_valid_alert = False
        final_class = 'argument'
        
        if probability >= 10 or has_scream or has_crying or total_threats > 0 or total_emergency > 0 or total_vulgarity > 0:
            is_valid_alert = True
            if has_crying or total_emergency > 0:
                final_class = 'help'
            elif has_scream:
                final_class = 'scream'
            elif total_threats > 0:
                final_class = 'threat'
                
        if is_valid_alert:
            problematic_dialogues = [d for d in dialogue if d.get('has_vulgarity') or d.get('is_threat') or d.get('is_emergency')]
            
            buckets = {}
            # 1. Bucket từ sự kiện âm thanh YAMNet (tiếng hét & tiếng khóc)
            for t in scream_timestamps:
                b = int(t // 10)
                if b not in buckets: buckets[b] = set()
                buckets[b].add('scream')

            for t in cry_timestamps:
                b = int(t // 10)
                if b not in buckets: buckets[b] = set()
                buckets[b].add('help')

            # 2. Bucket từ các đoạn bị chèn tiếng bíp kiểm duyệt
            for start_ms, end_ms in beep_intervals:
                b = int((start_ms / 1000) // 10)
                if b not in buckets: buckets[b] = set()
                buckets[b].add('argument')

            # 3. Phân bổ các câu đối thoại vi phạm vào TẤT CẢ các đoạn 10 giây mà nó trải dài qua
            for pd in problematic_dialogues:
                pd_type = 'argument'
                if pd.get('is_emergency'): pd_type = 'help'
                elif pd.get('is_threat'): pd_type = 'threat'
                elif has_crying: pd_type = 'help'
                elif has_scream: pd_type = 'scream'

                start_b = int(pd['start_time'] // 10)
                end_b = int(pd['end_time'] // 10)
                for b in range(start_b, end_b + 1):
                    if b not in buckets: buckets[b] = set()
                    buckets[b].add(pd_type)

            if not buckets:
                # Nếu không xác định được mốc thời gian cụ thể, chia toàn bộ file thành các đoạn 10s
                max_b = max(1, int(np.ceil(total_duration_ms / 10000)))
                for b in range(max_b):
                    buckets[b] = {final_class}
                
            for b in sorted(buckets.keys()):
                types = buckets[b]
                start_s = b * 10
                end_s = min(total_duration_ms / 1000, start_s + 10)
                if start_s >= (total_duration_ms / 1000):
                    continue
                
                bucket_type = 'argument'
                if 'help' in types: bucket_type = 'help'
                elif 'scream' in types: bucket_type = 'scream'
                elif 'threat' in types: bucket_type = 'threat'
                
                start_ms = int(start_s * 1000)
                end_ms = int(end_s * 1000)
                audio_snippet = censored_audio[start_ms:end_ms]
                
                alert_filename = f"alert_10s_{uuid.uuid4().hex[:8]}.wav"
                alert_filepath = os.path.join(UPLOAD_DIR, alert_filename)
                try:
                    audio_snippet.export(alert_filepath, format="wav")
                except Exception as e:
                    print(f"Lỗi khi export alert 10s audio: {e}")
                    
                # Chỉ lấy đúng các từ được phát ra trong khoảng [start_s, end_s] của đoạn 10s này
                words_in_bucket = [
                    getattr(w, 'word', '').strip()
                    for w in whisper_words
                    if (start_s - 0.2 <= getattr(w, 'start', 0.0) < end_s + 0.2)
                    or (start_s - 0.2 <= getattr(w, 'end', 0.0) <= end_s + 0.2)
                ]
                words_in_bucket = [w for w in words_in_bucket if w]
                
                if words_in_bucket:
                    bucket_text = " ".join(words_in_bucket)
                    bucket_text = unicodedata.normalize("NFC", bucket_text)
                    for p in PROFANITY_WORDS:
                        if p and p.strip():
                            bucket_text = re.sub(r"(?i)(?<!\w)" + re.escape(p.strip()) + r"(?!\w)", "***", bucket_text)
                else:
                    overlapping = [
                        d['text'] for d in dialogue 
                        if (start_s <= d['start_time'] <= end_s) or (start_s <= d['end_time'] <= end_s)
                    ]
                    bucket_text = " ".join(overlapping) if overlapping else (censored_transcript if total_duration_ms <= 12000 else "")
                
                alerts_found.append({
                    "start_time_seconds": start_s,
                    "end_time_seconds": round(end_s, 1),
                    "filename": alert_filename,
                    "soundType": bucket_type,
                    "confidence": probability,
                    "transcript": bucket_text.strip(),
                    "has_vulgarity": total_vulgarity > 0,
                    "is_threat": total_threats > 0,
                    "is_emergency": total_emergency > 0,
                    "has_crying": has_crying,
                    "has_scream": has_scream
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