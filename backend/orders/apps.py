# backend/orders/apps.py

from django.apps import AppConfig


class OrdersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "orders"
    verbose_name = "Orders / Checkout / Delivery Flow"

    def ready(self):
        """
        Hook chạy khi app 'orders' được load.
        Bạn có thể import signals tại đây nếu cần xử lý tự động,
        ví dụ:
            from . import signals  # noqa
        Hiện tại để trống cho nhẹ.
        """
        pass
