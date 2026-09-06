with open(r'c:\NKKH\esp32-voice-recorder-20260828T083632Z-1-001\codetrainplatf\main.cpp', 'r', encoding='utf-8') as f:
    c1 = f.read()

with open(r'c:\NKKH\esp32-voice-recorder-20260828T083632Z-1-001\esp32-voice-recorder\src\main.cpp', 'r', encoding='utf-8') as f:
    c2 = f.read()

import re
print("--- Constants in codetrainplatf ---")
for line in c1.split('\n'):
    if 'AUDIO_THRESHOLD' in line or 'IMPACT_' in line or 'RECORD_' in line:
        print(line)

print("\n--- Constants in esp32-voice-recorder ---")
for line in c2.split('\n'):
    if 'AUDIO_THRESHOLD' in line or 'IMPACT_' in line or 'RECORD_' in line:
        print(line)
