import os
import sys
# Thư viện này cần thiết để lấy ứng dụng WSGI
from django.core.wsgi import get_wsgi_application

# 1. FIX QUAN TRỌNG CHO LỖI "ModuleNotFoundError: No module named 'backend'"
# Thêm thư mục gốc dự án (/app) vào đường dẫn hệ thống. 
# Điều này cho phép Python tìm thấy module 'backend' và tất cả các ứng dụng con.
sys.path.append('/app') 

# 2. FIX CHO ĐỊA CHỈ SETTINGS MODULE
# Phải trỏ đến module settings đầy đủ: [tên_thư_mục_chứa_settings].[tên_file_settings_không_.py]
# Tức là: 'backend.settings'
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()