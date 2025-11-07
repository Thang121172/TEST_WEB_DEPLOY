from .base import *
import os
import dj_database_url 
# --- QUAN TRỌNG: Phải import hàm config để đọc biến môi trường ---
from decouple import config 

# --- 1. Cấu hình Hosts và Bảo mật ---

# Lấy SECRET_KEY từ môi trường Render
SECRET_KEY = config('SECRET_KEY')

# Lấy hostname của Render (ví dụ: fastfood-low3.onrender.com)
RENDER_EXTERNAL_HOSTNAME = config('RENDER_EXTERNAL_HOSTNAME')

# Khởi tạo ALLOWED_HOSTS: Thêm domain chính của Render
ALLOWED_HOSTS = []
if RENDER_EXTERNAL_HOSTNAME:
    # Thêm host chính của Render (để giải quyết lỗi DisallowedHost)
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Thêm 127.0.0.1 để tránh lỗi HTTP HEAD check khi khởi động
ALLOWED_HOSTS.append('127.0.0.1') 


# === Cấu hình Production bắt buộc ===
DEBUG = False 

# Đảm bảo Django xử lý header X-Forwarded-Host từ Render (HTTPS)
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Các cài đặt bảo mật quan trọng cho Production
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000  # Bật HSTS cho 1 năm
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_SSL_REDIRECT = True # Buộc chuyển hướng HTTP sang HTTPS
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIF = True


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

# Nơi thu thập tất cả file tĩnh
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') 
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# --- 4. Cấu hình Celery (Sử dụng Redis của Render) ---

# Render sẽ cung cấp biến môi trường REDIS_URL
CELERY_BROKER_URL = config('REDIS_URL')
CELERY_RESULT_BACKEND = config('REDIS_URL')

# Tắt Mailhog (chỉ dùng trong dev), giữ mặc định SMTP cho Production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'