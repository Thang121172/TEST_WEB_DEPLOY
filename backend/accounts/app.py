# backend/accounts/app.py
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    
    # SỬA LỖI: Tên (name) phải là đường dẫn module đầy đủ
    # thay vì chỉ là "accounts"
    name = "backend.accounts"

    def ready(self):
        """
        Hook chạy khi Django khởi động app.
        """
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass