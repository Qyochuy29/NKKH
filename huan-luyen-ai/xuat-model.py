"""
export_onnx.py — Export trained PyTorch model sang định dạng ONNX

Sử dụng:
  python export_onnx.py

Output: ./models/audio_classifier.onnx
→ Copy file này vào backend/models/ để Node.js backend load qua onnxruntime-node
"""

import os
import torch
import numpy as np

# Import model class from train.py
from train import AudioClassifier, N_MFCC, MAX_LEN


def export():
    model_path = './models/audio_classifier.pth'

    if not os.path.exists(model_path):
        print("⚠️ Chưa có model. Chạy train.py trước!")
        print("   Đang tạo model demo...")
        model = AudioClassifier()
    else:
        model = AudioClassifier()
        model.load_state_dict(torch.load(model_path, map_location='cpu'))

    model.eval()

    # Dummy input matching expected shape: (batch, n_mfcc, max_len)
    dummy_input = torch.randn(1, N_MFCC, MAX_LEN)

    onnx_path = './models/audio_classifier.onnx'
    os.makedirs('./models', exist_ok=True)

    torch.onnx.export(
        model,
        dummy_input,
        onnx_path,
        export_params=True,
        opset_version=13,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'},
        }
    )

    print(f"✅ Model exported to {onnx_path}")
    print(f"   Input shape: (batch, {N_MFCC}, {MAX_LEN})")
    print(f"   Output: 4 classes [la_het, keu_cuu, de_doa, cai_vua]")
    print()
    print("📋 Bước tiếp theo:")
    print("   1. Copy file .onnx vào backend/models/")
    print("   2. Cài onnxruntime-node trong backend")
    print("   3. Thay MockAiService bằng OnnxAiService")


if __name__ == '__main__':
    export()
