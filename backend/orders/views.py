from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Sum
from django.utils.timezone import now

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Order, OrderItem
from menus.models import MenuItem, Merchant, MerchantMember # Corrected import

# =========================================================
# Helpers
# =========================================================

def get_user_role(user) -> str:
    """
    Trả về role từ Profile. Mặc định 'customer' nếu user chưa có profile.
    """
    profile = getattr(user, "profile", None)
    if profile and getattr(profile, "role", None):
        return profile.role
    return "customer"


def user_merchants(user):
    """
    Lấy danh sách merchant mà user này có quyền (owner hoặc staff).
    Dùng cho merchant dashboard và MerchantViewSet.
    """
    return Merchant.objects.filter(
        Q(owner=user) | Q(members__user=user)
    ).distinct()


def serialize_order_item(item: OrderItem):
    return {
        "id": item.id,
        "menu_item_id": item.menu_item_id,  # menu_item là FK -> menu_item_id luôn có
        "name": item.name_snapshot,
        "price": str(item.price_snapshot),
        "quantity": item.quantity,
        "line_total": str(item.line_total),
    }


def serialize_order(order: Order):
    return {
        "id": order.id,
        "status": order.status,
        "payment_status": order.payment_status,
        "total_amount": str(order.total_amount),
        "delivery_address": order.delivery_address,
        "note": order.note,
        "merchant": {
            "id": order.merchant.id,
            "name": order.merchant.name,
        },
        "shipper": (
            {
                "id": order.shipper.id,
                "username": order.shipper.username,
            }
            if order.shipper
            else None
        ),
        "items": [serialize_order_item(i) for i in order.items.all()],
        "created_at": order.created_at,
        "updated_at": order.updated_at,
    }


# =========================================================
# 1️⃣ ORDER VIEWSET (Customer-side)
# Routes dưới prefix /api/orders/
#
# - list(): lịch sử đơn của user hiện tại (customer)
# - retrieve(): xem chi tiết 1 đơn thuộc về mình
# - create(): checkout (tạo đơn hàng mới)
#
# Body tạo đơn (checkout) ví dụ:
# {
#   "merchant_id": 5,
#   "delivery_address": "123 Lê Lợi, Q1",
#   "note": "ít cay",
#   "items": [
#     { "menu_item_id": 10, "quantity": 2 },
#     { "menu_item_id": 11, "quantity": 1 }
#   ]
# }
# =========================================================

class OrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/orders/
        -> trả về danh sách đơn hàng của chính user hiện tại.
        """
        qs = Order.objects.filter(customer=request.user).order_by("-created_at")
        data = [serialize_order(o) for o in qs]
        return Response(data, status=status.HTTP_200_OK)

    def retrieve(self, request, pk=None):
        """
        GET /api/orders/{id}/
        -> chỉ xem được nếu đơn đó thuộc về mình.
        """
        try:
            order = Order.objects.get(pk=pk, customer=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(serialize_order(order), status=status.HTTP_200_OK)

    @transaction.atomic
    def create(self, request):
        """
        POST /api/orders/
        -> customer checkout tạo đơn mới (status=PENDING).
        """
        user = request.user
        role = get_user_role(user)
        if role not in ["customer", "admin"]:
            return Response({"detail": "Chỉ customer mới được tạo đơn."}, status=403)

        merchant_id = request.data.get("merchant_id")
        delivery_address = request.data.get("delivery_address", "")
        note = request.data.get("note", "")
        items_payload = request.data.get("items", [])

        # Lấy merchant
        try:
            merchant = Merchant.objects.get(id=merchant_id, is_active=True)
        except Merchant.DoesNotExist:
            return Response({"detail": "Merchant không tồn tại"}, status=400)

        # Tạo order khung
        order = Order.objects.create(
            customer=user,
            merchant=merchant,
            status=Order.Status.PENDING,
            payment_status=Order.PaymentStatus.UNPAID,
            delivery_address=delivery_address,
            note=note,
            total_amount=Decimal("0.00"),
        )

        total_amount = Decimal("0.00")

        # Duyệt giỏ hàng
        for row in items_payload:
            menu_item_id = row.get("menu_item_id")
            quantity = int(row.get("quantity", 1))

            try:
                m_item = MenuItem.objects.get(id=menu_item_id)
            except MenuItem.DoesNotExist:
                transaction.set_rollback(True)
                return Response(
                    {"detail": f"Menu item {menu_item_id} không tồn tại"},
                    status=400,
                )

            price_snapshot = m_item.price
            line_total = price_snapshot * quantity
            total_amount += line_total

            OrderItem.objects.create(
                order=order,
                menu_item=m_item,
                name_snapshot=m_item.name,
                price_snapshot=price_snapshot,
                quantity=quantity,
                line_total=line_total,
            )

        # cập nhật tổng tiền
        order.total_amount = total_amount
        order.save(update_fields=["total_amount"])

        return Response(serialize_order(order), status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        """
        POST /api/orders/{id}/set_status/
        Body: { "status": "DELIVERED" }
        => Cho phép (tạm thời) đổi trạng thái đơn hàng thủ công.
        (Bạn có thể khoá lại cho chỉ admin hoặc chủ sở hữu sau này)
        """
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

        new_status = request.data.get("status")
        if not new_status:
            return Response({"detail": "status required"}, status=400)

        # Không cứng validation ở đây để bạn dễ test.
        order.status = new_status
        order.save(update_fields=["status"])
        return Response({"id": order.id, "status": order.status}, status=200)


# =========================================================
# 2️⃣ MERCHANT VIEWSET
# Routes dưới prefix /api/merchant/
#
# - list(): liệt kê menu item để quản lý tồn kho
# - update_stock(): POST /api/merchant/{id}/update_stock/
#
# Sau này bạn có thể thêm list_orders(), confirm_order(), ready_for_pickup()...
# =========================================================

class MerchantViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/merchant/
        -> trả danh sách món (MenuItem). Hiện đang chưa filter theo merchant cụ thể,
          vì MenuItem hiện chỉ có merchant_id dạng số (chưa FK chặt).
        Bạn có thể filter theo merchant_id của user sau.
        """
        items = MenuItem.objects.all().order_by("id")
        data = [
            {
                "id": m.id,
                "name": m.name,
                "price": str(m.price),
                "stock": m.stock,
                "merchant_id": m.merchant_id,
            }
            for m in items
        ]
        return Response(data, status=200)

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """
        POST /api/merchant/{menu_item_id}/update_stock/
        Body: { "stock": 42 }
        -> cập nhật tồn kho món ăn.
        """
        try:
            menu = MenuItem.objects.get(pk=pk)
        except MenuItem.DoesNotExist:
            return Response({"detail": "not found"}, status=404)

        try:
            new_stock = int(request.data.get("stock", menu.stock))
        except (TypeError, ValueError):
            return Response({"detail": "invalid stock"}, status=400)

        menu.stock = new_stock
        menu.save(update_fields=["stock"])
        return Response({"id": menu.id, "stock": menu.stock}, status=200)


# =========================================================
# 3️⃣ SHIPPER VIEWSET
# Routes dưới prefix /api/shipper/
#
# - list(): đơn chưa giao xong (khác DELIVERED)
# - pickup(): POST /api/shipper/{order_id}/pickup/
#              -> shipper nhận đơn, chuyển trạng thái sang đang giao
#
# Gợi ý: bạn có thể mở rộng:
#   - available(): liệt kê đơn READY_FOR_PICKUP chưa ai nhận
#   - update_status(): cập nhật DELIVERING / DELIVERED
# =========================================================

class ShipperViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def list(self, request):
        """
        GET /api/shipper/
        -> danh sách đơn hàng chưa hoàn tất giao (trừ DELIVERED).
        Hiện tại không lọc theo shipper, để shipper thấy đơn nào còn open.
        Bạn có thể siết sau.
        """
        qs = Order.objects.exclude(status=Order.Status.DELIVERED).order_by("-created_at")
        data = [
            {
                "id": o.id,
                "status": o.status,
                "created_at": o.created_at.isoformat(),
                "merchant": {
                    "id": o.merchant.id,
                    "name": o.merchant.name,
                },
                "total_amount": str(o.total_amount),
            }
            for o in qs
        ]
        return Response(data, status=200)

    @action(detail=True, methods=['post'])
    def pickup(self, request, pk=None):
        """
        POST /api/shipper/{order_id}/pickup/
        -> shipper nhận đơn.
        Hiện tại: đặt status thành DELIVERING và gán shipper=request.user.
        (sau này có thể kiểm tra chỉ cho pickup nếu status = READY_FOR_PICKUP)
        """
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "not found"}, status=404)

        # set shipper cho đơn này
        order.shipper = request.user
        order.status = Order.Status.DELIVERING
        order.save(update_fields=["shipper", "status"])

        return Response(
            {
                "id": order.id,
                "status": order.status,
                "shipper_id": order.shipper.id if order.shipper else None,
            },
            status=200,
        )


# =========================================================
# 4️⃣ MERCHANT DASHBOARD
# GET /api/merchant/dashboard/   (sau này bạn có thể mount endpoint này)
#
# Tóm tắt:
# - tổng số đơn hôm nay
# - tổng doanh thu hôm nay
# - số món hết hàng
# - danh sách đơn gần đây
#
# Lưu ý: vì bạn chưa mount endpoint này trong router, nên muốn dùng
# thì phải tự add path(...) trong urls project.
# =========================================================

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def merchant_dashboard(request):
    """
    Dashboard cho merchant: thống kê trong ngày cho 1 merchant mà user có quyền.
    Hiện tại: lấy merchant đầu tiên mà user sở hữu / là member.
    """
    merchants_qs = user_merchants(request.user)
    merchant = merchants_qs.first()
    if not merchant:
        return Response({"detail": "Bạn không phải merchant."}, status=403)

    today = now().date()

    today_orders = (
        Order.objects.filter(
            merchant=merchant,
            created_at__date=today,
        )
        .order_by("-created_at")
        .select_related("customer")
    )

    orders_today_count = today_orders.count()
    revenue_today = today_orders.aggregate(total=Sum("total_amount"))["total"] or Decimal("0.00")

    # món hết hàng
    sold_out_count = MenuItem.objects.filter(
        merchant_id=merchant.id,
        stock=0,
    ).count()

    recent_orders = [
        {
            "order_id": o.id,
            "customer_username": getattr(o.customer, "username", "Khách"),
            "total": str(o.total_amount),
            "payment_status": o.payment_status,
            "status": o.status,
            "time": o.created_at.strftime("%H:%M"),
        }
        for o in today_orders[:7]
    ]

    return Response(
        {
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
            },
            "orders_today": orders_today_count,
            "revenue_today": str(revenue_today),
            "sold_out": sold_out_count,
            "recent_orders": recent_orders,
        },
        status=200,
    )