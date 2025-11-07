# backend/accounts/app.py
from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        """
        Hook chạy khi Django khởi động app.
        Nếu có signals (ví dụ auto tạo profile sau khi tạo User),
        ta import ở đây để kích hoạt. Nếu chưa có thì bỏ qua, không crash.
        """
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
