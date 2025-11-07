# backend/core/wsgi.py

import os
from django.core.wsgi import get_wsgi_application

# Sử dụng cấu hình dev cho môi trường docker-compose
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings.dev")

application = get_wsgi_application()
