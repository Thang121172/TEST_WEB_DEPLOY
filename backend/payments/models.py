# backend/payments/models.py

from django.db import models
from django.conf import settings
from orders.models import Order


class PaymentTransaction(models.Model):
    """
    Giao dịch thanh toán gắn với 1 Order.
    Ví dụ:
    - COD
    - Chuyển khoản
    - Ví điện tử (Momo/VNPay) trong tương lai
    """

    class Method(models.TextChoices):
        COD = "COD", "Cash on Delivery"
        CASH = "CASH", "Tiền mặt trực tiếp"
        TRANSFER = "TRANSFER", "Chuyển khoản"
        GATEWAY = "GATEWAY", "Cổng thanh toán"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REFUNDED = "REFUNDED", "Refunded"

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="payments",
        help_text="Đơn hàng liên quan đến giao dịch này",
    )

    method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.COD,
        help_text="Phương thức thanh toán",
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        help_text="Trạng thái thanh toán",
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Số tiền thanh toán",
    )

    external_ref = models.CharField(
        max_length=255,
        blank=True,
        default="",
        help_text="Mã giao dịch từ cổng thanh toán ngoài (nếu có)",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return f"Payment(order={self.order_id}, status={self.status}, amount={self.amount})"
