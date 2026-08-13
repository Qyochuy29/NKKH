FROM python:3.12-slim

WORKDIR /app

# Cài đặt ffmpeg cho pydub xử lý âm thanh
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy toàn bộ mã nguồn
COPY . .

# Set biến môi trường để hỗ trợ Unicode (Tiếng Việt)
ENV PYTHONIOENCODING=utf-8
ENV FLASK_APP=server.py
ENV FLASK_RUN_HOST=0.0.0.0

EXPOSE 5000

CMD ["flask", "run"]
