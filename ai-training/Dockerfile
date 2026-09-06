FROM python:3.11-slim

WORKDIR /app

# Cài đặt ffmpeg và libsndfile1 cho xử lý âm thanh (pydub, librosa, faster-whisper)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn
COPY . .

# Set biến môi trường
ENV PYTHONUNBUFFERED=1
ENV PYTHONIOENCODING=utf-8
ENV UPLOAD_DIR=/tai-lieu
ENV WHISPER_MODEL_SIZE=small

EXPOSE 5000

CMD ["python", "server.py"]

