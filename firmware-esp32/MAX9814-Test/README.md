# MAX9814 microphone test

Firmware chẩn đoán độc lập cho ESP32-S3 và microphone analog MAX9814.

## Nối dây

| MAX9814 | ESP32-S3 |
|---|---|
| VDD | 3.3V |
| GND | GND |
| OUT | GPIO4 |
| GAIN | Để trống |
| AR | Để trống |

## Sử dụng

1. Nạp firmware qua `COM6`.
2. Kết nối điện thoại hoặc máy tính vào Wi-Fi `ESP32-MIC-TEST`.
3. Mở `http://192.168.4.1`.
4. Nhấn **Thu âm 5 giây**, nói hoặc vỗ tay gần microphone.
5. Nghe WAV và xem RMS/min/max trên trang.

Firmware này không cần Docker, backend hoặc Internet.
