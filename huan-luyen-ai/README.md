# 🧠 AI Training — SafeVoice AI

Module huấn luyện model AI nhận diện âm thanh bạo lực học đường.

> ⚠️ Module này **tách biệt hoàn toàn** khỏi backend Node.js.
> Chỉ chạy thủ công khi cần huấn luyện/cập nhật model.

## Luồng hoạt động

```
[Thu thập audio .wav] → [tien-xu-ly.py] → [huan-luyen.py] → [xuat-model.py] → audio_classifier.onnx
                                                                                    ↓
                                                            Copy vào backend/models/
                                                                                    ↓
                                                    Backend Node.js load qua onnxruntime-node
                                                    → Thay thế MockAiService bằng OnnxAiService
```

## Cài đặt

```bash
cd ai-training
pip install -r requirements.txt
```

## 4 lớp phân loại

| Lớp | Mã | Mô tả |
|-----|-----|-------|
| La hét | `la_het` | Tiếng la hét, thét lớn |
| Kêu cứu | `keu_cuu` | Tiếng kêu cứu, cầu cứu |
| Đe dọa | `de_doa` | Giọng nói đe dọa, hăm dọa |
| Cãi vã | `cai_vua` | Tiếng cãi vã to tiếng |

## Chạy demo (với dữ liệu giả)

```bash
# 1. Tiền xử lý (tạo random features nếu chưa có audio thật)
python tien-xu-ly.py

# 2. Huấn luyện model
python huan-luyen.py

# 3. Export sang ONNX
python xuat-model.py
```

## Chuẩn bị dataset thật

1. Thu thập file `.wav` cho từng lớp
2. Tổ chức theo cấu trúc:
   ```
   raw_audio/
     la_het/
       001.wav, 002.wav, ...
     keu_cuu/
       001.wav, ...
     de_doa/
       001.wav, ...
     cai_vua/
       001.wav, ...
   ```
3. Chạy `python tien-xu-ly.py --data_dir ./raw_audio`
4. Chạy `python huan-luyen.py`
5. Chạy `python xuat-model.py`

## Tích hợp vào backend

1. Copy `models/audio_classifier.onnx` → `backend/models/`
2. Cài thêm `onnxruntime-node` trong backend
3. Tạo `OnnxAiService` thay thế `MockAiService`:
   - Load model từ file `.onnx`
   - Nhận audio buffer → trích MFCC → inference → trả kết quả
   - Gọi `alertsService.submitDetection()` khi phát hiện
