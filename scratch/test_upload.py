import requests
import wave
import struct
import os

# Create a dummy valid wav file
with wave.open('dummy.wav', 'w') as f:
    f.setnchannels(1)
    f.setsampwidth(2)
    f.setframerate(16000)
    # Write 1 sec of silence
    for _ in range(16000):
        f.writeframesraw(struct.pack('<h', 0))

url = "http://localhost:3000/api/alerts/device-recording?device_id=Cam-HL1&type=analyze&confidence=0&event_id=test_123"
headers = {
    "Content-Type": "audio/wav",
    "X-Device-Token": "your_secure_device_token_123"
}
with open('dummy.wav', 'rb') as f:
    data = f.read()

print("Sending request...")
try:
    r = requests.post(url, headers=headers, data=data)
    print("Status Code:", r.status_code)
    print("Response:", r.text)
except Exception as e:
    print("Error:", e)
