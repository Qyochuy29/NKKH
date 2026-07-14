# 🛡️ SafeVoice AI

Hệ thống giám sát và cảnh báo bạo lực học đường ứng dụng AI nhận diện âm thanh.

## 🚀 Khởi chạy nhanh

```bash
# Clone và chạy
docker-compose up --build

# Truy cập
http://localhost:3000/login.html
```

Backend sẽ tự động:
1. Chạy database migration (`prisma migrate deploy`)
2. Seed dữ liệu mẫu (thiết bị, người dùng, cảnh báo lịch sử)
3. Khởi động mock AI service sinh cảnh báo giả lập mỗi 15-40 giây

## 👥 Tài khoản demo

| Vai trò | Email | Mật khẩu |
|---------|-------|-----------|
| Quản trị viên | `admin@gmail.com` | `password123` |
| Ban giám hiệu | `bgh@gmail.com` | `password123` |
| Giám thị | `giamthi@gmail.com` | `password123` |
| Bảo vệ | `baove@gmail.com` | `password123` |

## 🏗️ Kiến trúc

```
[Mock AI Service] --submitDetection()--> [NestJS Backend]
                                              |
                                   +----------+----------+
                                   |          |          |
                              [PostgreSQL]  [Redis]  [WebSocket]
                              (Prisma ORM)              |
                                                        v
                                        [HTML/CSS/JS Dashboard - Realtime]
```

## 📁 Cấu trúc thư mục

```
├── backend/          # NestJS API server (TypeScript)
├── frontend/         # Vanilla HTML/CSS/JS (multi-page)
├── ai-training/      # Python AI training skeleton (riêng biệt)
├── docker-compose.yml
└── README.md
```

## 🎯 Tính năng chính

- **Dashboard realtime** với sơ đồ trường học SVG và vị trí thiết bị
- **Cảnh báo trực tiếp** qua WebSocket với âm thanh thông báo
- **4 loại âm thanh** nhận diện: La hét, Kêu cứu, Đe dọa, Cãi vã
- **Phân quyền** theo vai trò (Admin, Ban giám hiệu, Giám thị, Bảo vệ)
- **Thống kê** với biểu đồ Chart.js (xu hướng, phân bổ, heatmap)
- **Dark mode** và responsive trên mobile/tablet
- **Xuất CSV** lịch sử cảnh báo

## 🐍 AI Training (Tùy chọn)

Xem `ai-training/README.md` để biết cách huấn luyện model AI thật và thay thế mock service.
