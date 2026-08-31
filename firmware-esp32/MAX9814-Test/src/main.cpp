#include <Arduino.h>
#include <WebServer.h>
#include <WiFi.h>
#include <esp_heap_caps.h>
#include <esp_timer.h>
#include <math.h>

namespace {

constexpr uint8_t MIC_PIN = 4;                // MAX9814 OUT -> GPIO4 (ADC1)
constexpr uint32_t SAMPLE_RATE = 16000;
constexpr uint32_t RECORD_SECONDS = 5;
constexpr size_t SAMPLE_COUNT = SAMPLE_RATE * RECORD_SECONDS;
constexpr size_t PCM_BYTES = SAMPLE_COUNT * sizeof(int16_t);

// Điền tên WiFi và mật khẩu nhà bạn vào đây:
constexpr char WIFI_SSID[] = "okok";
constexpr char WIFI_PASS[] = "Quochuy07";

WebServer server(80);
int16_t* pcmBuffer = nullptr;

struct AudioStats {
  uint16_t rawMin = 0;
  uint16_t rawMax = 0;
  float rawMean = 0.0f;
  float rms = 0.0f;
  int16_t peak = 0;
  uint32_t elapsedMs = 0;
  bool valid = false;
};

AudioStats lastStats;

const char INDEX_HTML[] PROGMEM = R"HTML(
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>MAX9814 Microphone Test</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:680px;margin:40px auto;padding:0 18px;background:#f5f7fb;color:#18212f}
    main{background:white;border-radius:16px;padding:24px;box-shadow:0 8px 30px #1f29371a}
    button{border:0;border-radius:10px;padding:13px 18px;background:#2563eb;color:white;font-weight:700;cursor:pointer}
    button:disabled{opacity:.55;cursor:wait} audio{width:100%;margin-top:18px}
    pre{background:#eef2ff;padding:14px;border-radius:10px;white-space:pre-wrap}.hint{color:#4b5563}
  </style>
</head>
<body><main>
  <h1>Kiểm tra micro MAX9814</h1>
  <p class="hint">MAX9814 OUT phải nối GPIO4. Nhấn nút, nói hoặc vỗ tay gần micro trong 5 giây.</p>
  <button id="record" onclick="recordAudio()">Thu âm 5 giây</button>
  <p id="status">Sẵn sàng.</p>
  <audio id="player" controls></audio>
  <pre id="stats">Chưa có kết quả.</pre>
  <script>
    async function recordAudio(){
      const button=document.getElementById('record');
      const status=document.getElementById('status');
      button.disabled=true;
      status.textContent='Đang thu âm 5 giây...';
      try{
        const response=await fetch('/record',{cache:'no-store'});
        if(!response.ok) throw new Error(await response.text());
        const blob=await response.blob();
        const player=document.getElementById('player');
        if(player.dataset.url) URL.revokeObjectURL(player.dataset.url);
        player.dataset.url=URL.createObjectURL(blob);
        player.src=player.dataset.url;
        status.textContent='Đã thu xong. Bấm Play để nghe.';
        const result=await fetch('/stats',{cache:'no-store'}).then(r=>r.json());
        document.getElementById('stats').textContent=
          `RMS: ${result.rms}\nPeak: ${result.peak}\nADC min/max: ${result.raw_min}/${result.raw_max}\nADC trung bình: ${result.raw_mean}\nThời gian thu: ${result.elapsed_ms} ms\nĐánh giá: ${result.assessment}`;
      }catch(error){
        status.textContent='Lỗi: '+error.message;
      }finally{
        button.disabled=false;
      }
    }
  </script>
</main></body></html>
)HTML";

void writeLe16(uint8_t* target, uint16_t value) {
  target[0] = static_cast<uint8_t>(value & 0xff);
  target[1] = static_cast<uint8_t>((value >> 8) & 0xff);
}

void writeLe32(uint8_t* target, uint32_t value) {
  target[0] = static_cast<uint8_t>(value & 0xff);
  target[1] = static_cast<uint8_t>((value >> 8) & 0xff);
  target[2] = static_cast<uint8_t>((value >> 16) & 0xff);
  target[3] = static_cast<uint8_t>((value >> 24) & 0xff);
}

void makeWavHeader(uint8_t* header) {
  memcpy(header, "RIFF", 4);
  writeLe32(header + 4, static_cast<uint32_t>(PCM_BYTES + 36));
  memcpy(header + 8, "WAVE", 4);
  memcpy(header + 12, "fmt ", 4);
  writeLe32(header + 16, 16);
  writeLe16(header + 20, 1);                  // PCM
  writeLe16(header + 22, 1);                  // mono
  writeLe32(header + 24, SAMPLE_RATE);
  writeLe32(header + 28, SAMPLE_RATE * 2);
  writeLe16(header + 32, 2);
  writeLe16(header + 34, 16);
  memcpy(header + 36, "data", 4);
  writeLe32(header + 40, static_cast<uint32_t>(PCM_BYTES));
}

const char* assessSignal() {
  if (!lastStats.valid) return "chưa thu";
  if (lastStats.rawMax >= 4090 || lastStats.rawMin <= 5) return "tín hiệu chạm ngưỡng ADC";
  if (lastStats.rms < 80.0f) return "tín hiệu rất nhỏ hoặc micro chưa nối";
  if (lastStats.rms < 250.0f) return "tín hiệu nhỏ";
  return "đã nhận được tín hiệu âm thanh";
}

bool captureAudio() {
  if (pcmBuffer == nullptr) return false;

  Serial.println("[MIC] Bat dau thu 5 giay...");
  const int64_t startedAt = esp_timer_get_time();
  uint32_t sum = 0;
  uint16_t rawMin = 4095;
  uint16_t rawMax = 0;

  // Giai đoạn đầu lưu trực tiếp mẫu ADC để tính chính xác mức DC bias.
  for (size_t i = 0; i < SAMPLE_COUNT; ++i) {
    const int64_t target = startedAt +
      (static_cast<int64_t>(i) * 1000000LL) / SAMPLE_RATE;
    while (true) {
      const int64_t remaining = target - esp_timer_get_time();
      if (remaining <= 0) break;
      if (remaining > 80) delayMicroseconds(static_cast<uint32_t>(remaining - 40));
    }

    const uint16_t raw = static_cast<uint16_t>(analogRead(MIC_PIN));
    pcmBuffer[i] = static_cast<int16_t>(raw);
    sum += raw;
    if (raw < rawMin) rawMin = raw;
    if (raw > rawMax) rawMax = raw;
  }

  const float mean = static_cast<float>(sum) / SAMPLE_COUNT;
  double squaredSum = 0.0;
  int16_t peak = 0;

  // Loại DC bias của MAX9814 và đổi ADC 12-bit thành PCM signed 16-bit.
  for (size_t i = 0; i < SAMPLE_COUNT; ++i) {
    int32_t centered = static_cast<int32_t>(pcmBuffer[i]) -
      static_cast<int32_t>(lroundf(mean));
    centered *= 16;
    centered = constrain(centered, -32768, 32767);
    pcmBuffer[i] = static_cast<int16_t>(centered);
    const int32_t magnitude = abs(centered);
    if (magnitude > peak) {
      peak = static_cast<int16_t>(magnitude > 32767 ? 32767 : magnitude);
    }
    squaredSum += static_cast<double>(centered) * centered;
  }

  lastStats.rawMin = rawMin;
  lastStats.rawMax = rawMax;
  lastStats.rawMean = mean;
  lastStats.rms = sqrt(squaredSum / SAMPLE_COUNT);
  lastStats.peak = peak;
  lastStats.elapsedMs = static_cast<uint32_t>((esp_timer_get_time() - startedAt) / 1000);
  lastStats.valid = true;

  Serial.printf(
    "[MIC] Xong | %lu ms | ADC min=%u max=%u mean=%.1f | RMS=%.1f peak=%d | %s\n",
    static_cast<unsigned long>(lastStats.elapsedMs), rawMin, rawMax, mean,
    lastStats.rms, peak, assessSignal());
  return true;
}

void handleRecord() {
  if (!captureAudio()) {
    server.send(500, "text/plain; charset=utf-8", "Không có bộ nhớ cho audio buffer");
    return;
  }

  uint8_t wavHeader[44];
  makeWavHeader(wavHeader);

  server.sendHeader("Cache-Control", "no-store");
  server.sendHeader("Content-Disposition", "inline; filename=\"max9814-test.wav\"");
  server.setContentLength(sizeof(wavHeader) + PCM_BYTES);
  server.send(200, "audio/wav", "");

  WiFiClient client = server.client();
  client.write(wavHeader, sizeof(wavHeader));
  const uint8_t* bytes = reinterpret_cast<const uint8_t*>(pcmBuffer);
  size_t sent = 0;
  while (sent < PCM_BYTES && client.connected()) {
    const size_t chunk = min(static_cast<size_t>(4096), PCM_BYTES - sent);
    const size_t written = client.write(bytes + sent, chunk);
    if (written == 0) break;
    sent += written;
    delay(0);
  }
  Serial.printf("[WEB] Da gui %u/%u byte PCM\n",
    static_cast<unsigned>(sent), static_cast<unsigned>(PCM_BYTES));
}

void handleStats() {
  String json = "{";
  json += "\"rms\":" + String(lastStats.rms, 1);
  json += ",\"peak\":" + String(lastStats.peak);
  json += ",\"raw_min\":" + String(lastStats.rawMin);
  json += ",\"raw_max\":" + String(lastStats.rawMax);
  json += ",\"raw_mean\":" + String(lastStats.rawMean, 1);
  json += ",\"elapsed_ms\":" + String(lastStats.elapsedMs);
  json += ",\"assessment\":\"" + String(assessSignal()) + "\"}";
  server.sendHeader("Cache-Control", "no-store");
  server.send(200, "application/json; charset=utf-8", json);
}

}  // namespace

void setup() {
  Serial.begin(115200);
  delay(1200);
  Serial.println("\n=== MAX9814 MICROPHONE TEST ===");
  Serial.printf("MAX9814 OUT -> GPIO%u\n", MIC_PIN);

  analogReadResolution(12);
  analogSetPinAttenuation(MIC_PIN, ADC_11db);
  pinMode(MIC_PIN, INPUT);

  pcmBuffer = static_cast<int16_t*>(heap_caps_malloc(
    PCM_BYTES, MALLOC_CAP_SPIRAM | MALLOC_CAP_8BIT));
  if (pcmBuffer == nullptr) {
    pcmBuffer = static_cast<int16_t*>(malloc(PCM_BYTES));
  }
  if (pcmBuffer == nullptr) {
    Serial.println("LOI: Khong cap phat duoc audio buffer 160 KB.");
    return;
  }
  Serial.printf("Audio buffer: %u byte OK | PSRAM: %u byte\n",
    static_cast<unsigned>(PCM_BYTES), static_cast<unsigned>(ESP.getPsramSize()));

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Dang ket noi WiFi...");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nLOI: Khong ket noi duoc WiFi. Kiem tra lai ten va mat khau.");
    return;
  }
  Serial.println("\nKet noi WiFi thanh cong!");

  server.on("/", HTTP_GET, []() {
    server.send_P(200, "text/html; charset=utf-8", INDEX_HTML);
  });
  server.on("/record", HTTP_GET, handleRecord);
  server.on("/stats", HTTP_GET, handleStats);
  server.onNotFound([]() {
    server.sendHeader("Location", "/");
    server.send(302, "text/plain", "");
  });
  server.begin();

  Serial.printf("WiFi: %s\n", WIFI_SSID);
  Serial.printf("Mo trinh duyet: http://%s\n", WiFi.localIP().toString().c_str());
  Serial.println("San sang.");
}

void loop() {
  server.handleClient();

  // Chế độ chẩn đoán: tự thu định kỳ để có thể kiểm tra MAX9814 chỉ qua Serial,
  // không cần điện thoại kết nối vào trang web của ESP32.
  static uint32_t nextAutomaticCapture = millis() + 3000;
  if (static_cast<int32_t>(millis() - nextAutomaticCapture) >= 0) {
    captureAudio();
    nextAutomaticCapture = millis() + 3000;
  }

  delay(2);
}
