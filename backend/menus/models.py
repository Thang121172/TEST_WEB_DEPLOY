# backend/menus/models.py

from django.db import models
from django.conf import settings

# Dùng custom user model mà ta đã cấu hình trong settings (accounts.User)
User = settings.AUTH_USER_MODEL


class Merchant(models.Model):
    """
    Đại diện cho một cửa hàng / quán (merchant).
    """
    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="owned_merchants",
        help_text="Chủ sở hữu chính của cửa hàng này",
    )
    name = models.CharField(
        max_length=120,
        help_text="Tên hiển thị của cửa hàng/quán ăn",
    )
    address = models.CharField(
        max_length=255,
        blank=True,
        help_text="Địa chỉ quán / bếp (có thể bỏ trống)",
    )
    phone = models.CharField(
        max_length=30,
        blank=True,
        help_text="Số điện thoại liên hệ cửa hàng",
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Cửa hàng có đang hoạt động nhận đơn hay tạm đóng",
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    def __str__(self) -> str:
        return self.name


class MerchantMember(models.Model):
    """
    Liên kết giữa 1 user và 1 merchant.
    - Cho phép phân quyền nội bộ merchant (owner, staff).
    - Dùng trong MyMerchantsView để liệt kê các merchant mà user thuộc về.
    """

    class Role(models.TextChoices):
        OWNER = "owner", "Owner"
        STAFF = "staff", "Staff"

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="merchant_memberships",
        help_text="User thuộc merchant này",
    )
    merchant = models.ForeignKey(
        Merchant,
        on_delete=models.CASCADE,
        related_name="members",
        help_text="Merchant mà user tham gia",
    )
    role = models.CharField(
        max_length=10,
        choices=Role.choices,
        default=Role.STAFF,
        help_text="Vai trò trong merchant",
    )
    joined_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        unique_together = ("user", "merchant")

    def __str__(self) -> str:
        return f"{self.user} @ {self.merchant} ({self.role})"


class MenuItem(models.Model):
    """
    Sản phẩm/menu cụ thể mà merchant bán.
    (Phiên bản đơn giản theo thiết kế ban đầu của bạn.)
    """
    name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stock = models.IntegerField(default=0)

    # Hiện tại bạn đang dùng merchant_id là IntegerField chứ không phải ForeignKey.
    # Mình giữ nguyên để không phá migration / logic cũ.
    merchant_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.name
