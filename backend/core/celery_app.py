# backend/core/celery_app.py
"""
Celery app dùng cho FastFood.
- Dùng Redis làm broker / result backend (config qua env trong docker-compose).
- Tự động khám phá tasks từ các app Django (accounts/tasks.py, orders/tasks.py, v.v.).
- Khớp timezone VN.
"""

import os
from celery import Celery
from django.conf import settings

# Đảm bảo Celery biết dùng settings dev của Django khi khởi động
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.dev")

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
    Bạn có thể mở shell Django trong container backend:
        python manage.py shell
    rồi:
        from core.celery_app import debug_task
        debug_task.delay()
    Sau đó xem docker compose logs celery_worker.
    """
    print(f"[CELERY DEBUG] Task running. Request={self.request!r}")
