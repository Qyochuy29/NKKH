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

## 🐍 AI Training (Tùy chọn)

Vui lòng xem trong thư mục `huan-luyen-ai/` hoặc `ai-training/` để biết cách huấn luyện model AI phân loại âm thanh thực tế và tích hợp thay thế cho dịch vụ Simulator.
