import sys
print("Python executable:", sys.executable)
print("Python version:", sys.version)

pkgs = ['torch', 'tensorflow', 'tensorflow_hub', 'faster_whisper', 'whisper', 'pydub', 'librosa', 'flask', 'scipy']
for pkg in pkgs:
    try:
        m = __import__(pkg)
        ver = getattr(m, '__version__', 'OK')
        print(f"  [+] {pkg}: {ver}")
    except Exception as e:
        print(f"  [-] {pkg}: {e}")

try:
    import torch
    print(f"CUDA available: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
except Exception:
    pass
