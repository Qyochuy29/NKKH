# 🤖 Báo Cáo Đánh Giá Hệ Thống AI (SchoolGuardian)

> **File phân tích chính:** `ai-training/server.py`
> **Công nghệ:** TensorFlow (YAMNet), pydub, SpeechRecognition, librosa, Flask

---

## 1. Kết quả đang đạt được (Tính năng hiện có)

Hệ thống AI hiện tại có một tư duy thiết kế luồng (pipeline) rất thông minh khi kết hợp được **2 nguồn dữ liệu** để bù trừ cho nhau:
1. **Phân tích tín hiệu âm thanh (YAMNet):** Bắt được tiếng la hét (Scream), tiếng ồn lớn kể cả khi nạn nhân không thể nói thành lời.
2. **Phân tích ngữ nghĩa (Speech-to-Text):** Dịch âm thanh thành văn bản tiếng Việt và quét các bộ từ khóa được chia nhóm rất sát thực tế học đường:
   - *Khẩn cấp (Emergency):* "cứu tôi", "có dao", "cháy"...
   - *Đe dọa (Threat):* "thích chết", "ăn đấm", "nhập viện"...
   - *Chửi thề (Profanity):* các từ văng tục.

**Các tính năng nổi bật khác:**
- **Auto Censor (Tự động che giấu):** Có chức năng chèn tiếng "Bíp" (Sine 1000Hz) đè lên đoạn có từ văng tục và thay thế bằng dấu `***` trên text để phụ huynh không phải nghe từ thô tục.
- **Speaker Diarization (Phân biệt người nói):** Có thuật toán chia cuộc hội thoại thành "Người A", "Người B" dựa vào khoảng lặng (silence).
- **Cơ chế tính điểm bạo lực (Violence Probability):** Tính toán % bạo lực dựa trên tần suất chửi thề, đe dọa, và la hét trong đoạn hội thoại.

---

## 2. Ưu điểm

- **Tư duy kết hợp (Hybrid AI):** Hàm `decide_final_class` xử lý logic ưu tiên rất tốt (Khẩn cấp ưu tiên 1 -> Đe dọa -> La hét -> Cãi vã).
- **Bảo mật file:** Hàm `resolve_safe_path()` chống được lỗ hổng Path Traversal.
- **Xử lý file dài:** Có cơ chế Sliding Window (cắt file mỗi 10 giây) trong API `/analyze-long` để tránh tràn RAM khi file ghi âm quá dài.

---

## 3. Các Lỗi / Hạn chế cần khắc phục & Tác dụng của chúng

> [!CAUTION]
> **Lỗi 1: Phụ thuộc 100% vào Internet cho STT (Nghiêm trọng)**
- **Tình trạng:** Code đang dùng `recognize_google(audio_data)` - đây là API miễn phí của Google.
- **Tác dụng/Hậu quả:** 
  1. Nếu mạng trường học bị rớt, tính năng nhận diện chữ chết toàn bộ. 
  2. Google giới hạn số lượng request, nếu nhiều thiết bị gửi lên cùng lúc, server sẽ bị block IP (chặn 24h). 
  3. Gửi file ghi âm học sinh lên máy chủ Google vi phạm nghiêm trọng quyền riêng tư.
- **Giải pháp:** Chuyển sang mô hình chạy Offline (Local) như **Whisper (OpenAI)** bản Tiny/Base hoặc **Vosk**. Chúng chạy trực tiếp trên RAM máy tính, không cần mạng, không bị giới hạn.

> [!WARNING]
> **Lỗi 2: Nhận diện tiếng hét dễ bị nhầm lẫn (False Positives)**
- **Tình trạng:** YAMNet là mô hình được Google huấn luyện trên 521 âm thanh chung chung (AudioSet).
- **Tác dụng/Hậu quả:** Tiếng học sinh nam cười đùa lớn ở hành lang, hoặc tiếng hò reo cổ vũ thể thao rất dễ bị YAMNet nhận nhầm là tiếng la hét (Scream), dẫn đến báo động giả liên tục làm phiền giám thị.
- **Giải pháp:** Cần tự thu thập một tập dữ liệu nhỏ (Dataset) gồm tiếng hét thật và tiếng ồn sân trường, sau đó Transfer Learning (huấn luyện lại lớp cuối) cho YAMNet để nó quen với môi trường học đường.

> [!WARNING]
> **Lỗi 3: Thuật toán chèn tiếng "Bíp" (Censor) bị sai lệch thời gian**
- **Tình trạng:** Code đang chia đều thời gian cho các từ: `ms_per_word = total_speech_ms / len(words)`.
- **Tác dụng/Hậu quả:** Trong thực tế, có từ đọc nhanh, có từ đọc chậm (ví dụ chữ "a" rất ngắn, nhưng chữ "khuỳnh" rất dài). Việc chia trung bình này làm cho tiếng Bíp bị trễ hoặc sớm hơn từ bậy thực sự. Kết quả: từ bậy vẫn nghe lọt, mà từ bình thường lại bị bíp mất.
- **Giải pháp:** Sử dụng mô hình STT có hỗ trợ **Word-level Timestamps** (như Whisper timestamped), trả về chính xác thời gian bắt đầu/kết thúc của từng từ để cắt tiếng bíp chính xác miligiây.

> [!TIP]
> **Lỗi 4: Nút thắt cổ chai ổ cứng (Disk I/O Bottleneck)**
- **Tình trạng:** Ở vòng lặp xử lý đoạn dài, mỗi 10 giây code lại `chunk.export(temp_filepath, format="wav")`, sau đó librosa lại đọc lên, rồi pydub lại đọc lên để censor, rồi xuất file lại.
- **Tác dụng/Hậu quả:** Ổ cứng Server sẽ bị cày nát (đọc/ghi liên tục hàng ngàn file rác). Server dễ treo.
- **Giải pháp:** Xử lý hoàn toàn trên RAM (In-memory `io.BytesIO()`), chỉ lưu xuống đĩa khi thực sự có cảnh báo bạo lực được phát hiện.

---

## 4. Hướng Giải Quyết Ưu Tiên Tới

Nếu bạn muốn nâng cấp hệ thống AI này lên để có thể demo hoặc chạy thực tế tốt hơn, tôi đề xuất:

1. **Thay ruột STT:** Gỡ bỏ Google SpeechRecognition, cài đặt `faster-whisper` (hoạt động offline, nhận tiếng Việt cực chuẩn, có timestamps cho từng chữ).
2. **Loại bỏ việc ghi file rác liên tục:** Sửa lại luồng xử lý audio bằng bộ nhớ đệm (buffer) để tốc độ phân tích nhanh gấp 10 lần.
3. **Cấu trúc lại thuật toán Diarization (Phân biệt người nói):** Hiện tại cứ im lặng 1 giây là code đổi từ Người A sang Người B, điều này không chính xác. Cần dùng pyannote.audio nếu muốn chia người nói thực sự.
