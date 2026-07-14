from flask import Flask, request, jsonify
import os
import numpy as np
import speech_recognition as sr
import librosa

# 1. Nhóm từ chửi thề, xúc phạm nặng (Profanity/Insults)
PROFANITY_WORDS = [
    'địt mẹ', 'đờ mờ', 'dm', 'đmm', 'con mẹ mày', 'đb', 'đầu buồi', 'đầu cu', 'cái lồn', 'con phò', 'điếm', 'đĩ', 'chó má', 'súc vật',
    'con cụ', 'tổ sư cha', 'mồ mả', 'vô học', 'mất dạy', 'con hoang',
    'nhờn lồn', 'nhờn mặt', 'mặt lồn', 'rác rưởi', 'nứng', 'hãm lồn', 'rẻ rách'
]

# 2. Nhóm câu cãi nhau, thách thức, đe dọa bạo lực (Verbal Conflict/Aggression)
THREAT_WORDS = [
    'thích chết', 'ăn đấm', 'chán sống', 'xanh cỏ',
    'câm cái mồm', 'nín ngay', 'vả vỡ mồm', 'sủa tiếp', 'tuổi lồn',
    'ngon thì', 'nhào vô', 'bước ra', 'đụng vào tao', 'sờ vào người',
    'gọi người', 'gọi hội', 'gọi anh em', 'bốc máy',
    'chém chết', 'xin tí huyết', 'đập gãy', 'phá nát', 'nhập viện',
    'biết nhà', 'coi chừng tao', 'gặp đâu đánh đó', 'bắt được',
    'đánh', 'giết', 'chết', 'tát', 'ra cổng trường', 'gặp tao'
]

# 3. Kêu cứu khẩn cấp (An ninh, Y tế, Cháy nổ)
EMERGENCY_WORDS = [
    'cứu tôi', 'giúp tôi', 'cứu em', 'cứu cháu', 'ối giời ơi', 'có ai không', 'cứu',
    'buông tao', 'thả tao', 'cướp', 'giết người', 'bỏ ra',
    'công an', 'bảo vệ', 'có dao', 'có súng', 'nó đâm',
    'cấp cứu', 'bệnh viện', 'xe thương', 'chảy máu', 'gãy xương', 'ngất', 'đột quỵ',
    'hộc máu', 'thở không được', 'ép tim',
    'cháy', 'nổ', 'sập', 'ngập', 'lụt', 'chìm', 'kẹt', 'ngạt khói',
    'phá cửa'
]

app = Flask(__name__)

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    filepath = data.get('filepath')
    
    if not filepath:
        return jsonify({"error": "Missing filepath parameter"}), 400
        
    if not os.path.exists(filepath):
        return jsonify({"error": f"File not found: {filepath}"}), 404
        
    try:
        transcript = ""
        has_vulgarity = False
        is_threat = False
        is_emergency = False
        
        try:
            r = sr.Recognizer()
            y, sr_rate = librosa.load(filepath, sr=16000)
            pcm16 = (y * 32767).astype(np.int16).tobytes()
            audio_data = sr.AudioData(pcm16, sr_rate, 2)
            
            transcript = r.recognize_google(audio_data, language="vi-VN")
            lower_text = transcript.lower()
            
            for word in PROFANITY_WORDS:
                if word in lower_text:
                    has_vulgarity = True
                    break
                    
            for word in THREAT_WORDS:
                if word in lower_text:
                    is_threat = True
                    break
                    
            for word in EMERGENCY_WORDS:
                if word in lower_text:
                    is_emergency = True
                    break
        except Exception as stt_err:
            print(f"STT Error: {stt_err}")
            
        # Quyết định phân loại chỉ dựa trên text
        mapped_class = 'argument' # Mặc định nếu không có từ khóa gì
        confidence = 50.0
        
        if is_emergency:
            mapped_class = 'help'
            confidence = 95.0
        elif is_threat:
            mapped_class = 'threat'
            confidence = 90.0
        elif has_vulgarity:
            mapped_class = 'argument'
            confidence = 85.0
            
        return jsonify({
            "soundType": mapped_class,
            "confidence": confidence,
            "transcript": transcript,
            "has_vulgarity": has_vulgarity,
            "is_threat": is_threat,
            "is_emergency": is_emergency
        })
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Chạy ở port 5000, lắng nghe từ mọi IP
    app.run(host='0.0.0.0', port=5000)
