# Dữ liệu mẫu (chuyển từ backend cũ)

## Tài khoản mặc định (password: `password123`)

| Tên | Email | Vai trò |
|-----|-------|---------|
| Nguyễn Văn Admin | admin@gmail.com | admin |
| Trần Thị Hiệu Trưởng | bgh@gmail.com | ban_giam_hieu |
| Lê Văn Giám Thị | giamthi@gmail.com | giam_thi |
| Phạm Minh Bảo Vệ | baove@gmail.com | bao_ve |

## Khu vực (Areas)

Tầng 1: Sân trường, Cổng trường chính, Khu vực tập thể dục, Canteen,
Hành lang T1, Lớp 1A1, Lớp 1A2, Nhà vệ sinh T1, Phòng bảo vệ, Phòng y tế

Tầng 2: Hành lang T2, Lớp 2A1, Lớp 2A2, Thư viện, Nhà vệ sinh T2,
Phòng giáo viên, Cầu thang

Tầng 3: Hành lang T3, Lớp 3A1, Lớp 4A1, Lớp 5A1, Phòng tin học,
Phòng âm nhạc, Nhà vệ sinh T3

## Thiết bị (Devices)

25 thiết bị micro đặt tên `MIC-001` đến `MIC-025`, mỗi khu vực 1 thiết bị.
- `battery_level`: 20–100%
- `status`: 60% online, 20% offline, 20% error (ngẫu nhiên)

## Cài đặt mặc định (Settings)

| Key | Value |
|-----|-------|
| min_confidence_threshold | 70 |
| monitor_scream | true |
| monitor_help | true |
| monitor_threat | true |
| monitor_argument | true |
| audio_retention_days | 30 |
| simulator_enabled | true |

## Ghi chú mẫu cho AlertLog

**confirmed:** "Xác nhận có học sinh cãi nhau...", "Giám thị báo cáo có nhóm học sinh..."
**false_alarm:** "Tiếng ồn reo hò trong tiết học thể dục...", "Học sinh nô đùa bình thường..."
**resolved:** "Giáo viên chủ nhiệm đã can thiệp...", "Đã đưa học sinh xuống phòng y tế..."
