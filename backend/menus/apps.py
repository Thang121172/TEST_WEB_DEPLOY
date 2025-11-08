# backend/menus/apps.py

from django.apps import AppConfig


class MenusConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    
    # SỬA LỖI: Tên (name) phải là đường dẫn module đầy đủ
    # thay vì chỉ là "menus"
    name = "backend.menus"
    verbose_name = "Merchant & Menu Management"

    def ready(self):
        """
        Hook chạy khi app khởi động.
        """
        pass