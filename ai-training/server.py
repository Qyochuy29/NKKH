import os
import sys

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
import speech_recognition as sr
from pydub import AudioSegment
from flask import Flask, request, jsonify

# ============================================================
# THƯ MỤC AUDIO ĐƯỢC PHÉP ĐỌC (chống path traversal)
# ============================================================
UPLOAD_DIR = os.path.abspath("../tai-lieu")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_MB = 20

# Ngưỡng tin cậy tối thiểu để tin vào kết quả của model phân loại âm thanh.
# Nếu model không chắc chắn (confidence thấp) và cũng không có từ khóa nào
# khớp trong transcript, kết quả sẽ được đánh dấu is_uncertain = True để
# frontend có thể hiển thị cảnh báo "chưa chắc chắn" thay vì khẳng định sai.
CONFIDENCE_THRESHOLD = 0.55

# ------------------------------------------------------------
# 1. Nhóm từ chửi thề, xúc phạm nặng (Profanity/Insults)
# ------------------------------------------------------------
PROFANITY_WORDS = [
    'địt mẹ', 'đờ mờ', 'dm', 'đmm', 'con mẹ mày', 'đb', 'đầu buồi', 'đầu cu',
    'cái lồn', 'con phò', 'điếm', 'đĩ', 'chó má', 'súc vật',
    'con cụ', 'tổ sư cha', 'mất dạy', 'con hoang', 'con chó', 'địt mẹ mày',
    'loại vô học', 'nhờn lồn', 'nhờn mặt', 'mặt lồn', 'rác rưởi', 'nứng',
    'hãm lồn', 'rẻ rách'
]

# ------------------------------------------------------------
# 2. Cụm đe dọa bạo lực nhiều âm tiết -> độ tin cậy cao
# ------------------------------------------------------------
THREAT_PHRASES = [
    'thích chết', 'ăn đấm', 'chán sống', 'xanh cỏ',
    'câm cái mồm', 'nín ngay', 'vả vỡ mồm', 'sủa tiếp', 'tuổi lồn',
    'ngon thì', 'nhào vô', 'bước ra', 'đụng vào tao', 'sờ vào người',
    'gọi người', 'gọi hội', 'gọi anh em', 'bốc máy',
    'chém chết', 'xin tí huyết', 'đập gãy', 'phá nát', 'nhập viện',
    'biết nhà', 'coi chừng tao', 'gặp đâu đánh đó', 'bắt được',
]

# Từ đơn quá chung chung (dễ báo sai: "đánh răng", "chết máy"...)
# chỉ tính là đe dọa nếu khớp >=2 từ hoặc đi kèm 1 cụm THREAT_PHRASES khác.
THREAT_WEAK_WORDS = ['đánh', 'giết', 'chết', 'tát']

SAFE_COLLOCATIONS = [
    'đánh răng', 'đánh đàn', 'đánh giá', 'đánh máy', 'đánh cờ', 'đánh bóng',
    'chết máy', 'chết điện', 'chết wifi', 'chết mạng', 'tát nước',
]

# ------------------------------------------------------------
# 3. Kêu cứu khẩn cấp (An ninh, Y tế, Cháy nổ)
# ------------------------------------------------------------
EMERGENCY_WORDS = [
    'cứu tôi', 'giúp tôi', 'cứu em', 'cứu cháu', 'ối giời ơi', 'có ai không',
    'cứu', 'buông tao', 'thả tao', 'cướp', 'giết người', 'bỏ ra',
    'công an', 'bảo vệ', 'có dao', 'có súng', 'nó đâm',
    'cấp cứu', 'bệnh viện', 'xe thương', 'chảy máu', 'gãy xương', 'ngất',
    'đột quỵ', 'hộc máu', 'thở không được', 'ép tim',
    'cháy', 'nổ', 'sập', 'ngập', 'lụt', 'chìm', 'kẹt', 'ngạt khói',
    'phá cửa'
]

app = Flask(__name__)

print("Đang tải bộ não AI YAMNet từ Google...")
try:
    yamnet_model_handle = 'https://tfhub.dev/google/yamnet/1'
    yamnet_model = hub.load(yamnet_model_handle)
    print("✅ Đã tải xong YAMNet!")
except Exception as e:
    print(f"⚠️ Lỗi tải YAMNet: {e}")


def resolve_safe_path(filename: str):
    """Chỉ cho phép đọc file nằm trong UPLOAD_DIR, chặn path traversal."""
    if not filename:
        return None
    safe_name = os.path.basename(filename)
    full_path = os.path.abspath(os.path.join(UPLOAD_DIR, safe_name))
    if os.path.commonpath([full_path, UPLOAD_DIR]) != UPLOAD_DIR:
        return None
    return full_path


def contains_word(text: str, phrase: str) -> bool:
    """So khớp theo ranh giới từ, tránh match nhầm bên trong chuỗi khác."""
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
    """Trả về (has_vulgarity, is_threat, is_emergency) từ nội dung câu nói."""
    lower_text = transcript.lower()

    # Google STT thường dùng dấu * để che từ chửi thề (ví dụ đ** m*)
    has_vulgarity = any(contains_word(lower_text, w) for w in PROFANITY_WORDS) or '*' in lower_text

    is_threat = any(contains_word(lower_text, p) for p in THREAT_PHRASES)
    if not is_threat:
        weak_hits = sum(
            1 for w in THREAT_WEAK_WORDS if detect_threat_weak_word(lower_text, w)
        )
        is_threat = weak_hits >= 2

    is_emergency = any(contains_word(lower_text, w) for w in EMERGENCY_WORDS)

    return has_vulgarity, is_threat, is_emergency


DANGEROUS_YAMNET_CLASSES = [22, 23, 26, 42, 43, 44] # Crying, Wail, Screaming, Shout, Bellow, Yell

def classify_audio(filepath):
    """Chạy model YAMNet, trả về (class_code, confidence)."""
    try:
        wav_data, _ = librosa.load(filepath, sr=16000)
        waveform = np.array(wav_data, dtype=np.float32)
        scores, embeddings, spectrogram = yamnet_model(waveform)
        scores_np = scores.numpy()
        
        # Lấy điểm cao nhất của các khung thời gian
        max_scores = np.max(scores_np, axis=0)
        
        scream_score = 0.0
        for c in DANGEROUS_YAMNET_CLASSES:
            if max_scores[c] > scream_score:
                scream_score = max_scores[c]
                
        speech_score = max_scores[0] # Lớp 0 là Speech
        
        if scream_score > CONFIDENCE_THRESHOLD:
            return 'scream', float(scream_score)
        else:
            # Mặc định là argument nếu không phải la hét (để STT phân xử tiếp)
            return 'argument', float(max(speech_score, 0.1))
    except Exception as e:
        print(f"Lỗi YAMNet: {e}")
        return 'argument', 0.1


def decide_final_class(model_class_code: str, confidence: float,
                        has_vulgarity: bool, is_threat: bool, is_emergency: bool):
    """
    Quyết định soundType cuối cùng, kết hợp cả 2 nguồn tín hiệu:
    - model âm thanh (tốt khi giọng nói không rõ ràng / la hét không thành lời)
    - từ khóa trong transcript (tốt khi lời nói được nhận dạng rõ)

    Thứ tự ưu tiên:
    1) Có từ khóa khẩn cấp trong lời nói -> 'help' (an toàn là trên hết)
    2) Có cụm/từ đe dọa -> 'threat'
    3) Model nhận diện tiếng hét với độ tin cậy cao -> giữ 'scream'
       (kể cả khi transcript có chửi thề, vì bản chất âm thanh là la hét)
    4) Có chửi thề nhưng không phải la hét/threat/help -> 'argument'
    5) Model đủ tin cậy -> dùng kết quả model
    6) Model không tin cậy & không có từ khóa nào -> vẫn trả kết quả model
       nhưng đánh dấu is_uncertain=True để hệ thống/frontend xử lý thận trọng
    """
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


@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json(silent=True) or {}
    filename = data.get('filepath')

    if not filename:
        return jsonify({"error": "Missing filepath parameter"}), 400

    filepath = resolve_safe_path(filename)
    if filepath is None:
        return jsonify({"error": "Invalid filename"}), 400

    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    if os.path.getsize(filepath) > MAX_FILE_SIZE_MB * 1024 * 1024:
        return jsonify({"error": f"File too large (>{MAX_FILE_SIZE_MB}MB)"}), 413

    try:
        # 1. Phân loại bằng model âm thanh YAMNet
        predicted_class, confidence = classify_audio(filepath)

        # 2. Speech-to-Text để phát hiện từ khóa trong nội dung nói
        transcript = ""
        has_vulgarity = is_threat = is_emergency = False

        try:
            r = sr.Recognizer()
            y, sr_rate = librosa.load(filepath, sr=16000)
            y = np.clip(y, -1.0, 1.0)  # tránh tràn số khi ép sang int16
            pcm16 = (y * 32767).astype(np.int16).tobytes()
            audio_data = sr.AudioData(pcm16, sr_rate, 2)

            transcript = r.recognize_google(audio_data, language="vi-VN")
            has_vulgarity, is_threat, is_emergency = analyze_transcript(transcript)
        except Exception as stt_err:
            # STT có thể thất bại (giọng hét không rõ lời, ồn quá lớn...).
            # Trong trường hợp đó ta vẫn tiếp tục, chỉ dựa vào model âm thanh.
            print(f"STT Error: {stt_err}")

        # 3. Kết hợp model âm thanh + từ khóa để ra quyết định cuối cùng
        final_class, is_uncertain = decide_final_class(
            predicted_class, confidence, has_vulgarity, is_threat, is_emergency
        )

        return jsonify({
            "soundType": final_class,
            "confidence": round(confidence * 100, 2),
            "transcript": transcript,
            "has_vulgarity": has_vulgarity,
            "is_threat": is_threat,
            "is_emergency": is_emergency,
            "is_uncertain": is_uncertain
        })

    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({"error": "Internal processing error"}), 500


@app.route('/analyze-long', methods=['POST'])
def analyze_long():
    data = request.get_json(silent=True) or {}
    filename = data.get('filepath')
    chunk_length_ms = data.get('chunk_length_ms', 10000) # Mặc định cắt mỗi đoạn 10 giây

    if not filename:
        return jsonify({"error": "Missing filepath parameter"}), 400

    filepath = resolve_safe_path(filename)
    if filepath is None or not os.path.exists(filepath):
        return jsonify({"error": "File not found or invalid path"}), 404

    # Cho phép file lớn hơn (vd 500MB) đối với phân tích dài
    if os.path.getsize(filepath) > 500 * 1024 * 1024:
        return jsonify({"error": "File too large (>500MB)"}), 413

    try:
        print(f"Đang xử lý file âm thanh dài: {filepath}")
        audio = AudioSegment.from_file(filepath)
        total_duration_ms = len(audio)
        
        alerts_found = []
        
        # Sliding window quét qua toàn bộ file
        for start_ms in range(0, total_duration_ms, chunk_length_ms):
            end_ms = start_ms + chunk_length_ms
            chunk = audio[start_ms:end_ms]
            
            # Tạo file tạm cho đoạn cắt
            temp_filename = f"temp_chunk_{uuid.uuid4().hex[:8]}.wav"
            temp_filepath = os.path.join(UPLOAD_DIR, temp_filename)
            chunk.export(temp_filepath, format="wav")
            
            try:
                # 1. Đặc trưng âm thanh YAMNet
                predicted_class, confidence = classify_audio(temp_filepath)
                
                # 2. Lời nói (STT)
                transcript = ""
                has_vulgarity = is_threat = is_emergency = False
                try:
                    r = sr.Recognizer()
                    y, sr_rate = librosa.load(temp_filepath, sr=16000)
                    y = np.clip(y, -1.0, 1.0)
                    pcm16 = (y * 32767).astype(np.int16).tobytes()
                    audio_data = sr.AudioData(pcm16, sr_rate, 2)
                    transcript = r.recognize_google(audio_data, language="vi-VN")
                    has_vulgarity, is_threat, is_emergency = analyze_transcript(transcript)
                except Exception as e:
                    print(f"Lỗi STT: {e}")
                    pass
                with open(os.path.join(UPLOAD_DIR, "transcript.txt"), "a", encoding="utf-8") as f:
                    f.write(f"[{start_ms//1000}s] STT: '{transcript}' | YAMNet: {predicted_class} ({confidence:.2f}) | V: {has_vulgarity}, E: {is_emergency}, T: {is_threat}\n")
                
                print(f"[{start_ms//1000}s] STT: '{transcript}' | YAMNet: {predicted_class} ({confidence:.2f})", flush=True)

                # 3. Quyết định
                final_class, is_uncertain = decide_final_class(
                    predicted_class, confidence, has_vulgarity, is_threat, is_emergency
                )
                
                # Điều kiện báo động: La hét, Kêu cứu, Đe dọa. Hoặc Cãi vã nhưng có Chửi thề!
                is_valid_alert = False
                if final_class in ['scream', 'help', 'threat'] and not is_uncertain:
                    is_valid_alert = True
                elif final_class == 'argument' and has_vulgarity and not is_uncertain:
                    is_valid_alert = True

                # Nếu là cảnh báo nguy hiểm
                if is_valid_alert:
                    alert_filename = f"alert_{start_ms//1000}s_{uuid.uuid4().hex[:6]}.wav"
                    alert_filepath = os.path.join(UPLOAD_DIR, alert_filename)
                    # Đổi tên file tạm thành file chính thức
                    os.rename(temp_filepath, alert_filepath)
                    
                    alerts_found.append({
                        "start_time_seconds": start_ms // 1000,
                        "end_time_seconds": end_ms // 1000,
                        "filename": alert_filename,
                        "soundType": final_class,
                        "confidence": round(confidence * 100, 2),
                        "transcript": transcript,
                        "has_vulgarity": has_vulgarity,
                        "is_threat": is_threat,
                        "is_emergency": is_emergency
                    })
                    print(f"-> PHÁT HIỆN: {final_class} tại giây {start_ms//1000}")
                else:
                    # Nếu an toàn, xóa file tạm đi cho nhẹ ổ cứng
                    os.remove(temp_filepath)
                    
            except Exception as chunk_err:
                print(f"Lỗi khi xử lý đoạn {start_ms}ms: {chunk_err}")
                if os.path.exists(temp_filepath):
                    os.remove(temp_filepath)
                    
        return jsonify({
            "status": "success",
            "total_duration_seconds": total_duration_ms // 1000,
            "alerts_count": len(alerts_found),
            "alerts": alerts_found
        })
        
    except Exception as e:
        import traceback
        err_msg = str(e) + "\n" + traceback.format_exc()
        print(f"Lỗi phân tích file dài: {err_msg}")
        return jsonify({"error": err_msg}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)