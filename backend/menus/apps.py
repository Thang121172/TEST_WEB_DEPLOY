# backend/menus/apps.py

from django.apps import AppConfig


class MenusConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "menus"
    verbose_name = "Merchant & Menu Management"

    def ready(self):
        """
        Hook chạy khi app khởi động.
        Nếu sau này bạn có signals (ví dụ auto tạo MerchantMember owner),
        bạn có thể import ở đây:
            from . import signals  # noqa
        Hiện tại để trống.
        """
        pass
