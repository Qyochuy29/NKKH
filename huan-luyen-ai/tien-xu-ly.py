"""
preprocess.py — Trích đặc trưng âm thanh MFCC / Spectrogram từ file .wav

Sử dụng:
  python preprocess.py --data_dir ./raw_audio --output_dir ./processed

Cấu trúc thư mục raw_audio:
  raw_audio/
    la_het/
      001.wav
    keu_cuu/
      001.wav
    de_doa/
      001.wav
    cai_vua/
      001.wav
"""

import os
import argparse
import numpy as np

# Khung sườn — khi có dataset thật, bỏ comment librosa
# import librosa

CLASSES = ['la_het', 'keu_cuu', 'de_doa', 'cai_vua']
SAMPLE_RATE = 22050
N_MFCC = 40
MAX_LEN = 100  # Max frames


def extract_features_from_file(filepath):
    """
    Trích xuất MFCC từ file .wav
    Khi chưa có dataset thật, trả về random tensor để demo luồng.
    """
    # Khi có librosa:
    # y, sr = librosa.load(filepath, sr=SAMPLE_RATE)
    # mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)
    # if mfcc.shape[1] < MAX_LEN:
    #     mfcc = np.pad(mfcc, ((0,0),(0, MAX_LEN - mfcc.shape[1])))
    # else:
    #     mfcc = mfcc[:, :MAX_LEN]
    # return mfcc

    # Demo: random tensor
    return np.random.randn(N_MFCC, MAX_LEN).astype(np.float32)


def preprocess_dataset(data_dir, output_dir):
    """Xử lý toàn bộ dataset và lưu thành numpy arrays."""
    os.makedirs(output_dir, exist_ok=True)

    all_features = []
    all_labels = []

    for class_idx, class_name in enumerate(CLASSES):
        class_dir = os.path.join(data_dir, class_name)

        if not os.path.exists(class_dir):
            print(f"⚠️ Thư mục {class_dir} không tồn tại, tạo dữ liệu giả...")
            # Tạo 50 samples giả cho mỗi lớp
            for i in range(50):
                features = np.random.randn(N_MFCC, MAX_LEN).astype(np.float32)
                all_features.append(features)
                all_labels.append(class_idx)
            continue

        for filename in os.listdir(class_dir):
            if filename.endswith('.wav'):
                filepath = os.path.join(class_dir, filename)
                features = extract_features_from_file(filepath)
                all_features.append(features)
                all_labels.append(class_idx)

    X = np.array(all_features)
    y = np.array(all_labels)

    np.save(os.path.join(output_dir, 'X.npy'), X)
    np.save(os.path.join(output_dir, 'y.npy'), y)

    print(f"✅ Đã xử lý {len(X)} mẫu ({len(CLASSES)} lớp)")
    print(f"   Shape: X={X.shape}, y={y.shape}")
    print(f"   Lưu tại: {output_dir}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Tiền xử lý dữ liệu âm thanh')
    parser.add_argument('--data_dir', default='./raw_audio', help='Thư mục chứa audio gốc')
    parser.add_argument('--output_dir', default='./processed', help='Thư mục lưu dữ liệu đã xử lý')
    args = parser.parse_args()

    preprocess_dataset(args.data_dir, args.output_dir)
