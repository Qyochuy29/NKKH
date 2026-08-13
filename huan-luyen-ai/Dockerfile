FROM python:3.10-slim

WORKDIR /app

# Cài đặt các gói hệ thống cần thiết cho soundfile (libsndfile1) và whisper (ffmpeg)
RUN apt-get update && apt-get install -y libsndfile1 ffmpeg git && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Cài đặt requirements
RUN pip install --default-timeout=1000 -r requirements.txt

COPY . .

EXPOSE 5000

CMD ["python", "may-chu-ai.py"]
