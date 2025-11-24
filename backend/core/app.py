import os
import django
from celery import Celery

# Thiết lập biến môi trường Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

# === BẢO VỆ CHỐNG LỖI populate() isn't reentrant ===
# Lệnh 'python manage.py migrate' đã tự động gọi django.setup().
# Nếu Celery app (được import) gọi lại setup(), sẽ gây ra RuntimeError.
# Chúng ta chỉ gọi setup() nếu nó chưa được gọi, hoặc nếu đây là một script độc lập.

# Gọi django.setup() và bắt lỗi reentrant
try:
    django.setup()
except RuntimeError as e:
    # Bắt lỗi nếu populate() đã xảy ra (thường khi chạy manage.py)
    # Nếu đây là lỗi reentrant, ta bỏ qua, nếu không ta raise lỗi
    if "populate() isn't reentrant" not in str(e):
        raise
    
# 3. Tạo ứng dụng Celery
app = Celery("core")

# Cấu hình Celery bằng cách sử dụng cài đặt Django.
app.config_from_object("django.conf:settings", namespace="CELERY")

# Tự động khám phá các tác vụ (tasks) trong các ứng dụng Django đã cài đặt.
app.autodiscover_tasks()

# NOTE: Nếu bạn muốn sử dụng tên app Celery là `celery_app` như convention cũ:
# from .app import app as celery_app 
# trong __init__.py của core.
