FROM python:3.11-slim

# Thiết lập thư mục làm việc trong container
WORKDIR /app

# Biến môi trường
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=on \
    # FIX QUAN TRỌNG: Thiết lập PYTHONPATH để Python có thể tìm thấy module 'backend'
    PYTHONPATH=/app

# Cài đặt các gói hệ thống cần thiết và công cụ wait-for-it
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    libpq-dev \
    zlib1g-dev \
    curl \
    # === THÊM CÔNG CỤ WAIT-FOR-IT ===
    # Tải và cài đặt wait-for-it.sh vào /usr/bin
    && curl -L https://raw.githubusercontent.com/vishnubob/wait-for-it/master/wait-for-it.sh -o /usr/bin/wait-for-it \
    && chmod +x /usr/bin/wait-for-it \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements và cài đặt Python dependencies
# Giả định requirements.txt nằm trong thư mục backend/
COPY backend/requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy toàn bộ source code backend vào container (Từ root context)
COPY . /app/

# Expose port
EXPOSE 8000

# Lệnh Production mặc định (Sử dụng Gunicorn)
# Lệnh này sẽ được ghi đè bởi docker-compose cho môi trường dev/worker
CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]