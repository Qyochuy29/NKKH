import serial
import serial.tools.list_ports
import time
import sys

def check():
    print("=== KIEM TRA KET NOI ESP32 ===")
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        print("[-] Khong tim thay cong COM nao!")
        return

    target_port = None
    for p in ports:
        print(f"[+] Cong tim thay: {p.device} ({p.description})")
        if "CH34" in p.description or "CP210" in p.description or "ESP" in p.description or "USB-Enhanced-SERIAL" in p.description or p.device == "COM4":
            target_port = p.device

    if not target_port:
        target_port = ports[0].device

    print(f"\n[+] Dang ket noi toi {target_port} o toc do 115200...")
    try:
        ser = serial.Serial(target_port, 115200, timeout=1)
    except Exception as e:
        print(f"[-] Khong the mo {target_port}: {e}")
        return

    try:
        # Don't toggle DTR/RTS aggressively so we don't keep resetting it
        time.sleep(0.2)
        print("[*] Dang theo doi log tu ESP32 trong 15 giay...\n----------------------------------------")
        start = time.time()
        while time.time() - start < 15:
            if ser.in_waiting > 0:
                raw = ser.readline()
                try:
                    line = raw.decode('utf-8', errors='replace').rstrip()
                    if line:
                        print(f"  {line}")
                except Exception:
                    print(f"  {raw}")
            else:
                time.sleep(0.05)
        print("----------------------------------------\n[*] Hoan tat kiem tra.")
    finally:
        ser.close()

if __name__ == "__main__":
    check()
