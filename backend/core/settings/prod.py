# backend/core/settings/prod.py

from .base import *
import os
import dj_database_url # Import này rất quan trọng

# --- 1. Cấu hình Bảo mật và Hosts ---

# Lấy SECRET_KEY từ môi trường Render
SECRET_KEY = config('SECRET_KEY')

# ALLOWED_HOSTS: Thêm domain chính của Render và các domain phụ nếu cần.
# Render sẽ cung cấp biến ALLOWED_HOSTS hoặc bạn có thể đọc tên host từ SERVICE_ID.
# Tên miền chính của bạn trên Render sẽ cần được thêm vào đây.
ALLOWED_HOSTS = [config('RENDER_EXTERNAL_HOSTNAME', default=''), '127.0.0.1']


# --- 2. Cấu hình Database (PostgreSQL) ---

# Render cung cấp biến môi trường DATABASE_URL cho dịch vụ Web Service.
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL')
    )
}
# Kích hoạt kết nối SSL cho Render (bắt buộc)
DATABASES['default']['CONN_MAX_AGE'] = 600
DATABASES['default']['OPTIONS'] = {'sslmode': 'require'} 


# --- 3. Cấu hình Static Files (Sử dụng Whitenoise) ---

# Thêm Whitenoise vào Middleware (thường đã có trong base.py, kiểm tra lại)
# MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')

# Nơi thu thập tất cả file tĩnh
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') 
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# --- 4. Cấu hình Celery (Sử dụng Redis của Render) ---

# Render sẽ cung cấp biến môi trường REDIS_URL
CELERY_BROKER_URL = config('REDIS_URL')
CELERY_RESULT_BACKEND = config('REDIS_URL')

# Tắt Mailhog, chuyển sang cấu hình email production nếu có (hoặc dùng dummy)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend' 
# Cấu hình SMTP thực tế nếu có hoặc giữ mặc định cho Production.

DEBUG = False # Phải là False trong Production