# 🛡️ SafeVoice AI

Hệ thống giám sát và cảnh báo bạo lực học đường ứng dụng AI nhận diện âm thanh.

## 🚀 Khởi chạy nhanh

### Trên Windows
Chạy file script có sẵn (sẽ tự động mở Docker và trình duyệt):
```bash
Chay_He_Thong.bat
```

### Chạy thủ công bằng Docker
```bash
# Khởi chạy hệ thống bằng Docker Compose
docker-compose up --build -d

# Truy cập trình duyệt
http://localhost:3000/dang-nhap.html
```

Hệ thống sẽ tự động:
1. Áp dụng schema CSDL và khởi tạo database (qua PostgreSQL).
2. Seed dữ liệu mẫu ban đầu (thiết bị, người dùng, lịch sử cảnh báo).
3. Khởi động backend (.NET C#) với `SimulatorBackgroundService` sinh cảnh báo giả lập tự động.

## 👥 Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Quản trị viên | `admin@gmail.com` | `password123` |
| Ban giám hiệu | `bgh@gmail.com` | `password123` |
| Giám thị | `giamthi@gmail.com` | `password123` |
| Bảo vệ | `baove@gmail.com` | `password123` |

## 🏗️ Kiến trúc

```
[Mock AI / Simulator] ------------> [C# .NET Backend]
                                          |
                               +----------+----------+
                               |          |          |
                          [PostgreSQL]  [Redis]  [SignalR Hub]
                          (EF Core)                   |
                                                      v
                                      [HTML/CSS/JS Dashboard - Realtime]
```

## 📁 Cấu trúc thư mục

```
├── backend-csharp/   # API server chính bằng ASP.NET Core (C#)
├── backend/          # [Cũ] API server bằng NestJS/TypeScript (Có thể bỏ qua)
├── frontend/         # Giao diện web Vanilla HTML/CSS/JS
├── huan-luyen-ai/    # Mã nguồn huấn luyện mô hình AI (Python)
├── ai-training/      # Mã nguồn huấn luyện AI dự phòng (Python)
├── mobile/           # Ứng dụng di động (nếu có)
├── tai-lieu/         # Chứa tài liệu và các file tĩnh (audio, hình ảnh)
├── docker-compose.yml# Cấu hình các dịch vụ Docker
├── Chay_He_Thong.bat # Script chạy nhanh hệ thống (Windows)
└── README.md
```

## 🎯 Tính năng chính

- **Dashboard realtime** với sơ đồ trường học SVG và định vị thiết bị.
- **Cảnh báo trực tiếp** qua WebSocket (SignalR) với âm thanh thông báo.
- **4 loại âm thanh** nhận diện: La hét, Kêu cứu, Đe dọa, Cãi vã.
- **Phân quyền** theo vai trò (Admin, Ban giám hiệu, Giám thị, Bảo vệ).
- **Thống kê** với biểu đồ Chart.js (xu hướng, phân bổ, heatmap).
- **Giao diện đa thiết bị** hỗ trợ Dark mode và responsive trên mobile/tablet.
- **Xuất CSV** dữ liệu lịch sử cảnh báo.

## 🧠 Khởi chạy Server AI Thực Tế (Tùy chọn)

Mặc định, backend sẽ dùng dữ liệu giả lập (Simulator). Để hệ thống nhận diện âm thanh thực tế thông qua mô hình AI, bạn cần chạy AI Server (Python):

### Cách 1: Chạy bằng Docker (Khuyên dùng)
1. Mở file `docker-compose.yml`
2. Tìm khối cấu hình `ai-service` và xóa dấu `#` (uncomment)
3. Chạy lại lệnh:
   ```bash
   docker-compose up --build -d
   ```
Hệ thống AI sẽ chạy ở cổng `5000` và kết nối trực tiếp với Backend.

### Cách 2: Chạy thủ công (không dùng Docker)
Nếu bạn muốn chạy server AI để tiện debug và test âm thanh:
```bash
# Di chuyển vào thư mục chứa server AI
cd ai-training

# Cài đặt các thư viện (yêu cầu Python 3.10+)
pip install flask tensorflow tensorflow_hub librosa pydub openai-whisper setuptools-rust

# Khởi chạy server AI
python server.py
```

*Lưu ý: Bạn cũng có thể vào thư mục `huan-luyen-ai/` để tham khảo mã nguồn tự huấn luyện mô hình âm thanh cá nhân.*
