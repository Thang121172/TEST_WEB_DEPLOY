from decimal import Decimal
from django.db import transaction
from django.db.models import Q, Sum
from django.utils.timezone import now

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Order, OrderItem, Review, MenuItemReview, Complaint
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

    @transaction.atomic
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        POST /api/orders/{id}/cancel/
        UC-10: Customer hủy đơn khi còn trong PENDING/CONFIRMED.
        Body: { "reason": "Lý do hủy (optional)" }
        """
        try:
            order = Order.objects.get(pk=pk, customer=request.user)
        except Order.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)

        # Chỉ cho phép hủy khi status là PENDING hoặc CONFIRMED
        if order.status not in [Order.Status.PENDING, Order.Status.CONFIRMED]:
            return Response(
                {
                    "detail": f"Không thể hủy đơn ở trạng thái {order.status}. Chỉ có thể hủy khi đơn ở trạng thái PENDING hoặc CONFIRMED."
                },
                status=400
            )

        reason = request.data.get("reason", "Khách hàng hủy đơn")
        
        # Lưu trạng thái cũ để kiểm tra hoàn trả kho
        was_confirmed = order.status == Order.Status.CONFIRMED

        # Cập nhật trạng thái
        order.status = Order.Status.CANCELED
        
        # Nếu đã thanh toán, chuyển payment_status sang REFUNDED
        if order.payment_status == Order.PaymentStatus.PAID:
            order.payment_status = Order.PaymentStatus.REFUNDED
        
        order.save(update_fields=["status", "payment_status"])

        # Hoàn trả kho nếu đã trừ (nếu merchant đã confirm và trừ kho)
        if was_confirmed:
            for item in order.items.all():
                if item.menu_item:
                    item.menu_item.stock += item.quantity
                    item.menu_item.save(update_fields=["stock"])

        return Response(
            {
                "id": order.id,
                "status": order.status,
                "payment_status": order.payment_status,
                "message": "Đơn hàng đã được hủy thành công"
            },
            status=200
        )


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


# =========================================================
# 5️⃣ REVIEW & RATING (UC-11)
# =========================================================

class ReviewViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request):
        """
        POST /api/reviews/
        UC-11: Customer đánh giá đơn/món/shipper
        Body: {
            "order_id": 1,
            "order_rating": 5,
            "merchant_rating": 4,
            "shipper_rating": 5,
            "comment": "Rất tốt",
            "menu_item_reviews": [
                {"order_item_id": 1, "rating": 5, "comment": "Ngon"},
                {"order_item_id": 2, "rating": 4, "comment": "OK"}
            ]
        }
        """
        user = request.user
        order_id = request.data.get("order_id")
        
        try:
            order = Order.objects.get(pk=order_id, customer=user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)
        
        # Chỉ cho phép đánh giá đơn đã DELIVERED
        if order.status != Order.Status.DELIVERED:
            return Response(
                {"detail": "Chỉ có thể đánh giá đơn hàng đã giao thành công"},
                status=400
            )
        
        # Kiểm tra đã đánh giá chưa
        if Review.objects.filter(order=order, customer=user).exists():
            return Response(
                {"detail": "Bạn đã đánh giá đơn hàng này rồi"},
                status=400
            )
        
        # Tạo review
        review = Review.objects.create(
            order=order,
            customer=user,
            order_rating=request.data.get("order_rating", 5),
            merchant_rating=request.data.get("merchant_rating"),
            shipper_rating=request.data.get("shipper_rating") if order.shipper else None,
            comment=request.data.get("comment", "")
        )
        
        # Tạo menu item reviews
        menu_item_reviews_data = request.data.get("menu_item_reviews", [])
        for item_review_data in menu_item_reviews_data:
            order_item_id = item_review_data.get("order_item_id")
            try:
                order_item = OrderItem.objects.get(pk=order_item_id, order=order)
                MenuItemReview.objects.create(
                    review=review,
                    order_item=order_item,
                    rating=item_review_data.get("rating", 5),
                    comment=item_review_data.get("comment", "")
                )
            except OrderItem.DoesNotExist:
                continue
        
        return Response({
            "id": review.id,
            "order_id": review.order_id,
            "order_rating": review.order_rating,
            "merchant_rating": review.merchant_rating,
            "shipper_rating": review.shipper_rating,
            "comment": review.comment,
            "created_at": review.created_at
        }, status=201)

    def retrieve(self, request, pk=None):
        """
        GET /api/reviews/{id}/
        Xem chi tiết review
        """
        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        
        menu_item_reviews = [
            {
                "id": mir.id,
                "order_item_id": mir.order_item_id,
                "item_name": mir.order_item.name_snapshot,
                "rating": mir.rating,
                "comment": mir.comment
            }
            for mir in review.menu_item_reviews.all()
        ]
        
        return Response({
            "id": review.id,
            "order_id": review.order_id,
            "customer": review.customer.username,
            "order_rating": review.order_rating,
            "merchant_rating": review.merchant_rating,
            "shipper_rating": review.shipper_rating,
            "comment": review.comment,
            "menu_item_reviews": menu_item_reviews,
            "created_at": review.created_at
        }, status=200)


# =========================================================
# 6️⃣ COMPLAINT & FEEDBACK (UC-13)
# =========================================================

class ComplaintViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def create(self, request):
        """
        POST /api/complaints/
        UC-13: Customer gửi khiếu nại
        Body: {
            "order_id": 1,
            "complaint_type": "FOOD_QUALITY",
            "title": "Món ăn không đúng",
            "description": "Chi tiết khiếu nại..."
        }
        """
        user = request.user
        order_id = request.data.get("order_id")
        
        try:
            order = Order.objects.get(pk=order_id, customer=user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)
        
        complaint = Complaint.objects.create(
            order=order,
            customer=user,
            complaint_type=request.data.get("complaint_type", Complaint.Type.OTHER),
            title=request.data.get("title", ""),
            description=request.data.get("description", "")
        )
        
        return Response({
            "id": complaint.id,
            "order_id": complaint.order_id,
            "complaint_type": complaint.complaint_type,
            "title": complaint.title,
            "status": complaint.status,
            "created_at": complaint.created_at
        }, status=201)

    def list(self, request):
        """
        GET /api/complaints/
        Danh sách khiếu nại
        - Customer: chỉ thấy khiếu nại của mình
        - Merchant/Admin: thấy tất cả khiếu nại liên quan
        """
        user = request.user
        role = get_user_role(user)
        
        if role == "customer":
            complaints = Complaint.objects.filter(customer=user)
        elif role in ["merchant", "admin"]:
            # Merchant thấy khiếu nại của đơn hàng thuộc merchant của họ
            if role == "merchant":
                merchants = user_merchants(user)
                complaints = Complaint.objects.filter(order__merchant__in=merchants)
            else:
                complaints = Complaint.objects.all()
        else:
            return Response({"detail": "Forbidden"}, status=403)
        
        data = [
            {
                "id": c.id,
                "order_id": c.order_id,
                "customer": c.customer.username,
                "complaint_type": c.complaint_type,
                "title": c.title,
                "description": c.description,
                "status": c.status,
                "response": c.response,
                "created_at": c.created_at
            }
            for c in complaints.order_by("-created_at")
        ]
        return Response(data, status=200)

    @action(detail=True, methods=['post'])
    def respond(self, request, pk=None):
        """
        POST /api/complaints/{id}/respond/
        Merchant/Admin phản hồi khiếu nại
        Body: {
            "response": "Phản hồi...",
            "status": "RESOLVED" hoặc "REJECTED"
        }
        """
        try:
            complaint = Complaint.objects.get(pk=pk)
        except Complaint.DoesNotExist:
            return Response({"detail": "Not found"}, status=404)
        
        user = request.user
        role = get_user_role(user)
        
        # Kiểm tra quyền
        if role == "customer":
            return Response({"detail": "Forbidden"}, status=403)
        
        if role == "merchant":
            merchants = user_merchants(user)
            if complaint.order.merchant not in merchants:
                return Response({"detail": "Forbidden"}, status=403)
        
        # Cập nhật phản hồi
        complaint.response = request.data.get("response", "")
        new_status = request.data.get("status")
        if new_status in [Complaint.Status.RESOLVED, Complaint.Status.REJECTED]:
            complaint.status = new_status
            if new_status == Complaint.Status.RESOLVED:
                from django.utils import timezone
                complaint.resolved_at = timezone.now()
        complaint.handled_by = user
        complaint.save()
        
        return Response({
            "id": complaint.id,
            "status": complaint.status,
            "response": complaint.response,
            "resolved_at": complaint.resolved_at
        }, status=200)


# =========================================================
# 7️⃣ MERCHANT: QUẢN LÝ KHO (UC-04) & XỬ LÝ THIẾU KHO (UC-12) & REFUND (UC-14)
# =========================================================

class InventoryViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def adjust_stock(self, request, pk=None):
        """
        POST /api/inventory/{menu_item_id}/adjust_stock/
        UC-04: Nhập/xuất/điều chỉnh kho
        Body: {
            "quantity": 10,  # Số lượng thay đổi (dương = nhập, âm = xuất)
            "reason": "Nhập hàng mới",
            "type": "IN" hoặc "OUT" hoặc "ADJUST"
        }
        """
        user = request.user
        role = get_user_role(user)
        
        if role not in ["merchant", "admin"]:
            return Response({"detail": "Forbidden"}, status=403)
        
        try:
            menu_item = MenuItem.objects.get(pk=pk)
        except MenuItem.DoesNotExist:
            return Response({"detail": "Menu item not found"}, status=404)
        
        # Kiểm tra quyền với merchant
        if role == "merchant":
            merchants = user_merchants(user)
            if menu_item.merchant not in merchants:
                return Response({"detail": "Forbidden"}, status=403)
        
        quantity = int(request.data.get("quantity", 0))
        stock_type = request.data.get("type", "ADJUST")
        
        if stock_type == "IN":
            menu_item.stock += abs(quantity)
        elif stock_type == "OUT":
            menu_item.stock = max(0, menu_item.stock - abs(quantity))
        else:  # ADJUST
            menu_item.stock = max(0, quantity)
        
        menu_item.save(update_fields=["stock"])
        
        return Response({
            "id": menu_item.id,
            "name": menu_item.name,
            "stock": menu_item.stock,
            "message": f"Đã cập nhật tồn kho thành công"
        }, status=200)


class MerchantOrderViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def handle_out_of_stock(self, request, pk=None):
        """
        POST /api/merchant/orders/{order_id}/handle_out_of_stock/
        UC-12: Xử lý thiếu kho
        Body: {
            "action": "SUBSTITUTE" hoặc "REDUCE" hoặc "CANCEL",
            "substitutions": [  # Nếu action = SUBSTITUTE
                {"order_item_id": 1, "new_menu_item_id": 5}
            ],
            "reductions": [  # Nếu action = REDUCE
                {"order_item_id": 1, "new_quantity": 1}
            ],
            "reason": "Lý do xử lý"
        }
        """
        user = request.user
        role = get_user_role(user)
        
        if role not in ["merchant", "admin"]:
            return Response({"detail": "Forbidden"}, status=403)
        
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)
        
        # Kiểm tra quyền
        if role == "merchant":
            merchants = user_merchants(user)
            if order.merchant not in merchants:
                return Response({"detail": "Forbidden"}, status=403)
        
        action = request.data.get("action")
        
        with transaction.atomic():
            if action == "SUBSTITUTE":
                # Đổi món
                substitutions = request.data.get("substitutions", [])
                for sub in substitutions:
                    order_item_id = sub.get("order_item_id")
                    new_menu_item_id = sub.get("new_menu_item_id")
                    try:
                        order_item = OrderItem.objects.get(pk=order_item_id, order=order)
                        new_menu_item = MenuItem.objects.get(pk=new_menu_item_id)
                        
                        # Cập nhật order item
                        order_item.menu_item = new_menu_item
                        order_item.name_snapshot = new_menu_item.name
                        order_item.price_snapshot = new_menu_item.price
                        order_item.line_total = new_menu_item.price * order_item.quantity
                        order_item.save()
                    except (OrderItem.DoesNotExist, MenuItem.DoesNotExist):
                        continue
                
            elif action == "REDUCE":
                # Giảm số lượng
                reductions = request.data.get("reductions", [])
                for red in reductions:
                    order_item_id = red.get("order_item_id")
                    new_quantity = int(red.get("new_quantity", 1))
                    try:
                        order_item = OrderItem.objects.get(pk=order_item_id, order=order)
                        order_item.quantity = max(1, new_quantity)
                        order_item.line_total = order_item.price_snapshot * order_item.quantity
                        order_item.save()
                    except OrderItem.DoesNotExist:
                        continue
                
            elif action == "CANCEL":
                # Hủy đơn
                order.status = Order.Status.CANCELED
                if order.payment_status == Order.PaymentStatus.PAID:
                    order.payment_status = Order.PaymentStatus.REFUNDED
                order.save()
                return Response({
                    "id": order.id,
                    "status": order.status,
                    "message": "Đơn hàng đã được hủy do thiếu kho"
                }, status=200)
            
            # Tính lại tổng tiền
            total = sum(item.line_total for item in order.items.all())
            order.total_amount = total
            order.save(update_fields=["total_amount"])
        
        return Response({
            "id": order.id,
            "total_amount": str(order.total_amount),
            "message": f"Đã xử lý thiếu kho bằng cách {action}"
        }, status=200)

    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """
        POST /api/merchant/orders/{order_id}/refund/
        UC-14: Xử lý refund
        Body: {
            "amount": 50000,  # Số tiền hoàn (null = hoàn toàn bộ)
            "reason": "Lý do hoàn tiền"
        }
        """
        user = request.user
        role = get_user_role(user)
        
        if role not in ["merchant", "admin"]:
            return Response({"detail": "Forbidden"}, status=403)
        
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found"}, status=404)
        
        # Kiểm tra quyền
        if role == "merchant":
            merchants = user_merchants(user)
            if order.merchant not in merchants:
                return Response({"detail": "Forbidden"}, status=403)
        
        # Chỉ refund nếu đã thanh toán
        if order.payment_status != Order.PaymentStatus.PAID:
            return Response(
                {"detail": "Chỉ có thể hoàn tiền cho đơn đã thanh toán"},
                status=400
            )
        
        refund_amount = request.data.get("amount")
        if refund_amount is None:
            refund_amount = order.total_amount
        else:
            refund_amount = Decimal(str(refund_amount))
            if refund_amount > order.total_amount:
                refund_amount = order.total_amount
        
        # Cập nhật payment status
        if refund_amount >= order.total_amount:
            order.payment_status = Order.PaymentStatus.REFUNDED
        else:
            # Partial refund - có thể cần thêm field refunded_amount
            order.payment_status = Order.PaymentStatus.REFUNDED
        
        order.save(update_fields=["payment_status"])
        
        return Response({
            "id": order.id,
            "refund_amount": str(refund_amount),
            "payment_status": order.payment_status,
            "message": f"Đã hoàn tiền {refund_amount} VNĐ"
        }, status=200)


# =========================================================
# 8️⃣ SHIPPER: XỬ LÝ VẤN ĐỀ
# =========================================================

    @action(detail=True, methods=['post'])
    def report_issue(self, request, pk=None):
        """
        POST /api/shipper/orders/{order_id}/report_issue/
        Shipper báo cáo vấn đề (RETURNED, FAILED_DELIVERY)
        Body: {
            "issue_type": "RETURNED" hoặc "FAILED_DELIVERY",
            "reason": "Lý do..."
        }
        """
        user = request.user
        role = get_user_role(user)
        
        if role not in ["shipper", "admin"]:
            return Response({"detail": "Forbidden"}, status=403)
        
        try:
            order = Order.objects.get(pk=pk, shipper=user)
        except Order.DoesNotExist:
            return Response({"detail": "Order not found or not assigned to you"}, status=404)
        
        issue_type = request.data.get("issue_type")
        reason = request.data.get("reason", "")
        
        # Cập nhật trạng thái
        if issue_type == "RETURNED":
            order.status = Order.Status.CANCELED  # Hoặc có thể thêm status RETURNED
        elif issue_type == "FAILED_DELIVERY":
            order.status = Order.Status.CANCELED  # Hoặc có thể thêm status FAILED_DELIVERY
        
        order.note = f"{order.note}\n[Shipper Issue]: {reason}".strip()
        order.save(update_fields=["status", "note"])
        
        return Response({
            "id": order.id,
            "status": order.status,
            "message": f"Đã báo cáo vấn đề: {issue_type}"
        }, status=200)


# =========================================================
# 9️⃣ ADMIN: QUẢN LÝ USER & ROLE (UC-09)
# =========================================================

class AdminViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def users(self, request):
        """
        GET /api/admin/users/
        UC-09: Danh sách users
        """
        user = request.user
        role = get_user_role(user)
        
        if role != "admin":
            return Response({"detail": "Forbidden"}, status=403)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        users = User.objects.all().select_related("profile")
        data = [
            {
                "id": u.id,
                "username": u.username,
                "email": getattr(u, "email", ""),
                "role": getattr(u.profile, "role", "customer") if hasattr(u, "profile") else "customer",
                "is_active": u.is_active,
                "date_joined": u.date_joined
            }
            for u in users
        ]
        return Response(data, status=200)

    @action(detail=True, methods=['patch'])
    def update_user_role(self, request, pk=None):
        """
        PATCH /api/admin/users/{user_id}/update_role/
        UC-09: Thay đổi role của user
        Body: {
            "role": "merchant" hoặc "shipper" hoặc "customer" hoặc "admin"
        }
        """
        user = request.user
        role = get_user_role(user)
        
        if role != "admin":
            return Response({"detail": "Forbidden"}, status=403)
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"detail": "User not found"}, status=404)
        
        new_role = request.data.get("role")
        if new_role not in ["customer", "merchant", "shipper", "admin"]:
            return Response({"detail": "Invalid role"}, status=400)
        
        # Cập nhật profile
        from accounts.models import Profile
        profile, created = Profile.objects.get_or_create(user=target_user)
        profile.role = new_role
        profile.save()
        
        return Response({
            "id": target_user.id,
            "username": target_user.username,
            "role": profile.role,
            "message": f"Đã cập nhật role thành {new_role}"
        }, status=200)