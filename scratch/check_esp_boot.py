import serial
import time

def monitor_with_reset():
    port = "COM4"
    print(f"[*] Mo cong {port}...")
    ser = serial.Serial(port, 115200, timeout=0.5)
    
    try:
        print("[*] Gui tin hieu Reset toi ESP32 qua RTS/DTR...")
        ser.dtr = False
        ser.rts = True
        time.sleep(0.1)
        ser.rts = False
        time.sleep(0.1)
        
        print("[*] Dang nhan log khoi dong tu ESP32 trong 20 giay:\n" + "="*50)
        start = time.time()
        while time.time() - start < 20:
            if ser.in_waiting > 0:
                data = ser.readline()
                try:
                    line = data.decode('utf-8', errors='replace').rstrip()
                    if line:
                        print(f"  {line}")
                except Exception:
                    print(f"  [RAW]: {data}")
            else:
                time.sleep(0.02)
        print("="*50)
    finally:
        ser.close()

if __name__ == "__main__":
    monitor_with_reset()
