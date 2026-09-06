import urllib.request
import os

wav_path = r"c:\NKKH\tai-lieu\alert_10s_2e75540f.wav"
if not os.path.exists(wav_path):
    print("Not found:", wav_path)
    exit(1)

with open(wav_path, "rb") as f:
    audio_data = f.read()

# Only take up to 1.8MB to be within 2MB limit
audio_data = audio_data[:1800000]

url = "http://localhost:3000/api/alerts/device-recording?device_id=Cam-HL1&type=analyze&edge_class=CHUI_NHAU&confidence=0.85"
req = urllib.request.Request(
    url,
    data=audio_data,
    headers={
        "Content-Type": "audio/wav",
        "X-Device-Token": "your_secure_device_token_123"
    }
)

try:
    with urllib.request.urlopen(req) as resp:
        print("HTTP Status:", resp.status)
        print("Response:", resp.read().decode())
except Exception as e:
    print("Error:", e)
