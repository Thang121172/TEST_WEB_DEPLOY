"""
WSGI config for your Django project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

# Dòng này rất quan trọng: Nó chỉ định file settings mà Django sẽ sử dụng.
# 'backend.settings' phải khớp với tên thư mục (backend) và tên file settings (settings.py).
os.environ.setdefault('DJANGO_SETTINGS_MODULE', '**settings**')
application = get_wsgi_application()