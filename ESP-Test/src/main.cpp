#include <Arduino.h>

void setup() {
  // Khởi tạo kết nối Serial với tốc độ baud 115200
  Serial.begin(115200);
  
  // Chip S3/C3 dùng cổng USB Serial tích hợp, cần delay 1-2s để mở kết nối
  delay(2000); 
  
  Serial.println("=====================================");
  Serial.println("Xin chao! ESP32 da san sang ket noi.");
  Serial.println("=====================================");
}

void loop() {
  Serial.println("Dang hoat dong... ping!");
  delay(2000); // Đợi 2 giây
}