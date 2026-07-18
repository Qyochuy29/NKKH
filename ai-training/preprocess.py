"""
preprocess.py — Trích đặc trưng âm thanh MFCC từ file audio thật

Sử dụng:
  python preprocess.py --data_dir ./raw_audio --output_dir ./processed

Cấu trúc thư mục raw_audio (mỗi lớp là 1 thư mục con):
  raw_audio/
    la_het/
      001.wav
      002.wav
    keu_cuu/
      001.wav
    de_doa/
      001.wav
    cai_vua/
      001.wav

Hỗ trợ .wav, .m4a, .mp3, .flac (librosa tự decode qua audioread/soundfile).

MẶC ĐỊNH script sẽ BÁO LỖI và dừng nếu không tìm thấy audio thật, để tránh
vô tình train model trên dữ liệu random mà không biết (đây là lỗi đã từng
xảy ra ở bản trước — extract_features_from_file() bị để demo bằng random
tensor). Chỉ dùng --allow_fake khi bạn CHỦ ĐỘNG muốn test luồng code.
"""

import os
import argparse
import numpy as np
import librosa

CLASSES = ['la_het', 'keu_cuu', 'de_doa', 'cai_vua']
SAMPLE_RATE = 22050
N_MFCC = 40
MAX_LEN = 100  # Max frames


def extract_features_from_file(filepath):
    """Trích MFCC thật từ 1 file audio, pad/cắt về đúng MAX_LEN frames."""
    y, sr = librosa.load(filepath, sr=SAMPLE_RATE)
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=N_MFCC)

    if mfcc.shape[1] < MAX_LEN:
        pad_width = MAX_LEN - mfcc.shape[1]
        mfcc = np.pad(mfcc, ((0, 0), (0, pad_width)), mode='constant')
    else:
        mfcc = mfcc[:, :MAX_LEN]

    return mfcc.astype(np.float32)


def preprocess_dataset(data_dir, output_dir, allow_fake=False):
    os.makedirs(output_dir, exist_ok=True)

    all_features = []
    all_labels = []
    total_real = 0

    for class_idx, class_name in enumerate(CLASSES):
        class_dir = os.path.join(data_dir, class_name)

        if not os.path.exists(class_dir):
            if not allow_fake:
                raise FileNotFoundError(
                    f"Thư mục '{class_dir}' không tồn tại.\n"
                    f"Đặt các file audio thật đã gán nhãn '{class_name}' vào đó, "
                    f"hoặc chạy lại với --allow_fake nếu chỉ muốn test luồng code."
                )
            print(f"⚠️ Thư mục {class_dir} không tồn tại, tạo 50 mẫu giả (--allow_fake)...")
            for _ in range(50):
                all_features.append(np.random.randn(N_MFCC, MAX_LEN).astype(np.float32))
                all_labels.append(class_idx)
            continue

        class_count = 0
        for filename in sorted(os.listdir(class_dir)):
            if filename.lower().endswith(('.wav', '.m4a', '.mp3', '.flac')):
                filepath = os.path.join(class_dir, filename)
                try:
                    features = extract_features_from_file(filepath)
                except Exception as e:
                    print(f"   ⚠️ Bỏ qua file lỗi '{filename}': {e}")
                    continue
                all_features.append(features)
                all_labels.append(class_idx)
                class_count += 1

        print(f"   {class_name}: {class_count} file thật")
        total_real += class_count

        if class_count == 0 and not allow_fake:
            raise ValueError(
                f"Thư mục '{class_dir}' tồn tại nhưng không có file audio hợp lệ nào "
                f"(.wav/.m4a/.mp3/.flac)."
            )

    if total_real == 0 and not allow_fake:
        raise ValueError("Không tìm thấy bất kỳ file audio thật nào trong toàn bộ dataset.")

    X = np.array(all_features)
    y = np.array(all_labels)

    np.save(os.path.join(output_dir, 'X.npy'), X)
    np.save(os.path.join(output_dir, 'y.npy'), y)

    print(f"\n✅ Đã xử lý {len(X)} mẫu ({len(CLASSES)} lớp), trong đó {total_real} mẫu THẬT")
    print(f"   Shape: X={X.shape}, y={y.shape}")
    print(f"   Lưu tại: {output_dir}")

    if total_real > 0 and total_real < 40:
        print(f"\n⚠️ Lưu ý: chỉ có {total_real} mẫu thật — khá ít cho CNN, model dễ")
        print("   không tổng quát tốt. Nên có ít nhất 50-100 mẫu/lớp, càng đa dạng")
        print("   người nói/ngữ cảnh/độ ồn càng tốt. Có thể tăng dữ liệu bằng cách")
        print("   thêm nhiễu, thay đổi tốc độ/pitch nhẹ (data augmentation).")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Tiền xử lý dữ liệu âm thanh')
    parser.add_argument('--data_dir', default='./raw_audio', help='Thư mục chứa audio gốc')
    parser.add_argument('--output_dir', default='./processed', help='Thư mục lưu dữ liệu đã xử lý')
    parser.add_argument('--allow_fake', action='store_true',
                         help='Cho phép sinh dữ liệu giả khi thiếu audio thật (chỉ dùng để test code, KHÔNG dùng để deploy thật)')
    args = parser.parse_args()

    preprocess_dataset(args.data_dir, args.output_dir, allow_fake=args.allow_fake)