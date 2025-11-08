import os
from celery import Celery
import django

# PHẢI ĐẶT LÀ 'core.settings' (hoặc 'core.settings.prod' nếu bạn muốn) 
# KHÔNG CÓ TIỀN TỐ 'backend.'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# Khởi tạo Celery App với tên project là 'core'
app = Celery('core') 

# Khởi tạo Django. Lỗi ModuleNotFoundError xảy ra NGAY SAU DÒNG NÀY.
django.setup() 

# Sử dụng cấu hình từ Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tự động tìm tasks trong tất cả các ứng dụng Django đã đăng ký.
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    """Debug task để kiểm tra Celery hoạt động."""
    print(f'Request: {self.request!r}')