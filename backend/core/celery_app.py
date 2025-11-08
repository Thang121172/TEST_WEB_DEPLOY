"""
Celery app dùng cho FastFood.
- Dùng Redis làm broker / result backend (config qua env trong docker-compose).
- Tự động khám phá tasks từ các app Django (accounts/tasks.py, orders/tasks.py, v.v.).
- Khớp timezone VN.
"""

import os
import django 
from django.conf import settings 
from celery import Celery

# ==============================================================
# ĐÃ LOẠI BỎ: THAO TÁC sys.path KHÔNG CẦN THIẾT TRONG MÔI TRƯỜNG DOCKER
# ==============================================================

# 1. Đảm bảo Celery biết dùng settings của Django khi khởi động.
# LỖI CŨ: "backend.core.settings" -> Gây ra ModuleNotFoundError
# SỬA: Dùng đường dẫn tuyệt đối (từ thư mục /app) trỏ đến file Production settings.
# Hãy đảm bảo bạn có file `settings/production.py` trong dự án.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.production")

# 2. BẮT BUỘC khởi tạo Django ngay lập tức để Celery đọc được settings.
django.setup() 

# Tạo Celery instance (tên "fastfood" để dễ nhận log)
app = Celery("fastfood")

# Celery đọc tất cả setting bắt đầu bằng CELERY_ từ Django settings
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tự động tìm tasks.py trong các app Django đã khai báo trong INSTALLED_APPS
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    """
    Task test nhanh để kiểm tra celery_worker có chạy không.
    """
    print(f"[CELERY DEBUG] Task running. Request={self.request!r}")