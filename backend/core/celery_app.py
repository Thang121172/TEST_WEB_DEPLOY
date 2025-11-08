# backend/core/celery_app.py
"""
Celery app dùng cho FastFood.
- Dùng Redis làm broker / result backend (config qua env trong docker-compose).
- Tự động khám phá tasks từ các app Django (accounts/tasks.py, orders/tasks.py, v.v.).
- Khớp timezone VN.
"""

import os
import sys
from celery import Celery
# Thêm import setup từ django
import django 
from django.conf import settings 

# ==============================================================
# QUAN TRỌNG: THÊM THƯ MỤC BACKEND VÀO PYTHON PATH
# ==============================================================
# Lấy đường dẫn tới thư mục backend/ (level 2)
# File này đang ở backend/core/celery_app.py
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
    # Thêm thư mục cha của 'backend' vào path (tức là thư mục WEB)
    sys.path.insert(0, os.path.dirname(BACKEND_DIR))


# 1. Đảm bảo Celery biết dùng settings của Django khi khởi động.
# Trỏ đến file settings.py của bạn
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.core.settings")

# 2. BẮT BUỘC khởi tạo Django ngay lập tức để Celery đọc được settings.
# Đây là bước cần thiết để Celery không dùng cấu hình mặc định (AMQP)
django.setup() 

# Tạo Celery instance (tên "fastfood" để dễ nhận log)
app = Celery("fastfood")

# Celery đọc tất cả setting bắt đầu bằng CELERY_ từ Django settings
# ví dụ: CELERY_BROKER_URL, CELERY_RESULT_BACKEND, CELERY_TIMEZONE...
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tự động tìm tasks.py trong các app Django đã khai báo trong INSTALLED_APPS
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    """
    Task test nhanh để kiểm tra celery_worker có chạy không.
    """
    print(f"[CELERY DEBUG] Task running. Request={self.request!r}")
