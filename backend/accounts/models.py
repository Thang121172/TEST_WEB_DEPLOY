# backend/accounts/models.py

import uuid
from django.db import models
from django.utils import timezone
from django.conf import settings

# ============================
# TẠM THỜI TẮT Custom User
# ============================
# from django.contrib.auth.models import AbstractUser
#
# class User(AbstractUser):
#     email = models.EmailField(
#         unique=True,
#         blank=False,
#         null=False,
#         help_text="Email dùng để đăng ký / đăng nhập / nhận OTP",
#     )
#
#     phone = models.CharField(
#         max_length=20,
#         blank=True,
#         null=True,
#         help_text="Số điện thoại (tùy chọn, có thể dùng OTP SMS sau này)",
#     )
#
#     def __str__(self):
#         return f"{self.username} <{self.email}>"

class Profile(models.Model):
    ROLE_CHOICES = [
        ("customer", "Customer"),
        ("merchant", "Merchant"),
        ("shipper", "Shipper"),
        ("admin", "Admin"),
    ]

    # Liên kết tới user mặc định của Django (auth.User)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="customer",
        help_text="Phân loại tài khoản để hạn chế endpoint phù hợp",
    )

    default_address = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Địa chỉ giao hàng mặc định (customer)",
    )

    store_name = models.CharField(
        max_length=150,
        blank=True,
        null=True,
        help_text="Tên cửa hàng/quán (merchant)",
    )

    store_address = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Địa chỉ cửa hàng/quán (merchant)",
    )

    vehicle_plate = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        help_text="Biển số xe (shipper)",
    )

    is_available = models.BooleanField(
        default=True,
        help_text="Shipper đang bật chế độ nhận đơn?",
    )

    def __str__(self):
        return f"{self.user} ({self.role})"

    @property
    def is_customer(self):
        return self.role == "customer"

    @property
    def is_merchant(self):
        return self.role == "merchant"

    @property
    def is_shipper(self):
        return self.role == "shipper"

    @property
    def is_admin_role(self):
        return self.role == "admin"


class OTPRequest(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
    )

    identifier = models.CharField(
        max_length=255,
        help_text="Email (hoặc phone sau này) dùng để nhận OTP",
    )

    code = models.CharField(
        max_length=8,
        help_text="Mã OTP, ví dụ 6 chữ số",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    expires_at = models.DateTimeField(
        help_text="Mã OTP hết hạn sau thời điểm này",
    )

    used = models.BooleanField(
        default=False,
        help_text="Đã dùng OTP này để verify chưa",
    )

    def __str__(self):
        return f"OTP({self.identifier}, code={self.code}, used={self.used})"

    def is_valid(self):
        return (not self.used) and (timezone.now() < self.expires_at)

    def mark_used(self):
        self.used = True
        self.save(update_fields=["used"])
