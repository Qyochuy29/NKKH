"""
train.py — Huấn luyện model phân loại âm thanh 4 lớp

Sử dụng:
  python preprocess.py --data_dir ./raw_audio   # Tạo dữ liệu thật trước
  python train.py                                # Huấn luyện model

Classes: la_het (0), keu_cuu (1), de_doa (2), cai_vua (3)
"""

import os
import argparse
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
from sklearn.model_selection import train_test_split

CLASSES = ['la_het', 'keu_cuu', 'de_doa', 'cai_vua']
NUM_CLASSES = len(CLASSES)
N_MFCC = 40
MAX_LEN = 100
EPOCHS = 20
BATCH_SIZE = 16
LEARNING_RATE = 0.001


class AudioClassifier(nn.Module):
    """CNN đơn giản cho phân loại âm thanh từ MFCC features."""

    def __init__(self):
        super(AudioClassifier, self).__init__()
        self.features = nn.Sequential(
            nn.Conv1d(N_MFCC, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm1d(64),
            nn.MaxPool1d(2),

            nn.Conv1d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm1d(128),
            nn.MaxPool1d(2),

            nn.Conv1d(128, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.AdaptiveAvgPool1d(1),
        )
        self.classifier = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(32, NUM_CLASSES),
        )

    def forward(self, x):
        x = self.features(x)
        x = x.squeeze(-1)
        x = self.classifier(x)
        return x


def train(allow_fake=False):
    data_dir = './processed'
    x_path = os.path.join(data_dir, 'X.npy')
    y_path = os.path.join(data_dir, 'y.npy')

    if not os.path.exists(x_path) or not os.path.exists(y_path):
        if not allow_fake:
            raise FileNotFoundError(
                "Chưa có dữ liệu đã xử lý (./processed/X.npy, y.npy).\n"
                "Chạy 'python preprocess.py --data_dir ./raw_audio' với audio thật trước.\n"
                "Chỉ dùng --allow_fake nếu bạn CHỦ ĐỘNG muốn test luồng code bằng dữ liệu random\n"
                "(model train ra sẽ VÔ DỤNG cho việc phân loại thật)."
            )
        print("⚠️ Chưa có dữ liệu thật. Đang tạo dữ liệu GIẢ để demo luồng code (--allow_fake)...")
        print("   MODEL TRAIN RA SẼ KHÔNG CÓ Ý NGHĨA PHÂN LOẠI THẬT.")
        X = np.random.randn(200, N_MFCC, MAX_LEN).astype(np.float32)
        y = np.random.randint(0, NUM_CLASSES, 200).astype(np.int64)
    else:
        X = np.load(x_path)
        y = np.load(y_path)

    print(f"📊 Dataset: {X.shape[0]} mẫu, {NUM_CLASSES} lớp")
    for idx, cls in enumerate(CLASSES):
        print(f"   {cls}: {(y == idx).sum()} mẫu")

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    train_dataset = TensorDataset(torch.FloatTensor(X_train), torch.LongTensor(y_train))
    test_dataset = TensorDataset(torch.FloatTensor(X_test), torch.LongTensor(y_test))
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = AudioClassifier().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)

    print(f"🚀 Training on {device}...")

    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += batch_y.size(0)
            correct += predicted.eq(batch_y).sum().item()

        acc = 100. * correct / total
        print(f"  Epoch {epoch+1}/{EPOCHS} — Loss: {total_loss/len(train_loader):.4f} — Acc: {acc:.1f}%")

    # Evaluate
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for batch_x, batch_y in test_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            outputs = model(batch_x)
            _, predicted = outputs.max(1)
            total += batch_y.size(0)
            correct += predicted.eq(batch_y).sum().item()

    test_acc = 100. * correct / total
    print(f"\n✅ Test Accuracy: {test_acc:.1f}%")

    # Sanity check: với 4 lớp, đoán ngẫu nhiên cho ~25% accuracy.
    # Nếu test accuracy quá gần mức này, model gần như không học được gì
    # (dữ liệu quá ít/kém đa dạng, hoặc nhãn bị sai/lộn thứ tự).
    random_baseline = 100. / NUM_CLASSES
    if test_acc <= random_baseline + 10:
        print(f"⚠️ CẢNH BÁO: Test accuracy ({test_acc:.1f}%) gần với mức đoán ngẫu nhiên")
        print(f"   ({random_baseline:.1f}% cho {NUM_CLASSES} lớp). Model có thể chưa học được")
        print("   gì đáng kể — kiểm tra lại: dữ liệu có đủ và đúng nhãn không, số mẫu/lớp")
        print("   có quá ít không, các lớp có bị lộn thứ tự thư mục so với CLASSES không.")

    os.makedirs('./models', exist_ok=True)
    torch.save(model.state_dict(), './models/audio_classifier.pth')
    print("💾 Model saved to ./models/audio_classifier.pth")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Huấn luyện model phân loại âm thanh')
    parser.add_argument('--allow_fake', action='store_true',
                         help='Cho phép train trên dữ liệu giả khi thiếu ./processed/X.npy (chỉ để test code)')
    args = parser.parse_args()

    train(allow_fake=args.allow_fake)