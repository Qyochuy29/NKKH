import serial
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

def read_passive(duration=20):
    try:
        ser = serial.Serial("COM4", 115200, timeout=1)
    except Exception as e:
        print(f"Error opening COM4: {e}")
        return

    print(f"[*] Monitoring COM4 for {duration} seconds...")
    start = time.time()
    while time.time() - start < duration:
        if ser.in_waiting > 0:
            data = ser.readline()
            try:
                line = data.decode('utf-8', errors='replace').rstrip()
                if line:
                    print(line)
            except Exception:
                pass
        time.sleep(0.02)
    ser.close()

if __name__ == "__main__":
    read_passive(20)
