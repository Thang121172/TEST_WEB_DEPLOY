# backend/accounts/views.py

import random
from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import OTPRequest, Profile
from .serializers import (
    RegisterSerializer,
    RegisterMerchantSerializer,
    RegisterRequestOTPSerializer,
    RegisterConfirmOTPSerializer,
    ResetPasswordConfirmSerializer,
    OTPRequestDebugSerializer,
)
from .tasks import send_otp_email  # Celery task gửi mail OTP
from menus.models import Merchant


User = get_user_model()


# =========================================================
# Helper tạo mã OTP
# =========================================================
def generate_otp_code(length: int = 6) -> str:
    """Sinh mã OTP numeric, ví dụ '384129'."""
    return "".join(random.choice("0123456789") for _ in range(length))


def _create_and_send_otp(email: str, purpose: str, ttl_minutes: int = 5):
    """
    Tạo OTPRequest và cố gắng gửi email.
    Trả (otp_obj, sent_ok, debug_code)
    - sent_ok: celery gửi được hay không
    - debug_code: mã OTP để trả ra response trong DEBUG (cho dev test nhanh)
    """
    code = generate_otp_code(6)

    otp_obj = OTPRequest.objects.create(
        identifier=email,
        code=code,
        expires_at=timezone.now() + timedelta(minutes=ttl_minutes),
    )

    sent_ok = True
    try:
        # Gửi mail async
        send_otp_email.delay(email, code)
    except Exception:
        # Celery chưa chạy hoặc lỗi SMTP
        sent_ok = False

    debug_code = code if (settings.DEBUG and not sent_ok) else None

    return otp_obj, sent_ok, debug_code


# =========================================================
# 1. Đăng ký thường (không OTP)
#
# POST /api/accounts/register/
# body: { "username": "...", "password": "...", "email": "...?" }
#
# -> tạo user, profile(role=customer) và trả access/refresh (nếu SimpleJWT ok)
# -> cái này chủ yếu để dev local tạo acc nhanh
# =========================================================
class RegisterView(APIView):
    """Đăng ký không OTP (dev/test)."""
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

        user = s.create(s.validated_data)
        user.is_active = True
        user.save(update_fields=['is_active'])

        payload = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'activated': True,
            'role': getattr(getattr(user, 'profile', None), 'role', 'customer'),
        }

        try:
            refresh = RefreshToken.for_user(user)
            payload.update({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            })
        except Exception:
            # Nếu SimpleJWT chưa setup đúng thì vẫn trả user info
            pass

        return Response(payload, status=status.HTTP_201_CREATED)


# =========================================================
# 2. OTP đăng ký - bước 1:
#
# POST /api/accounts/register/request-otp/
# body: { "email": "...", "password": "...", "role": "customer" }
#
# - validate email chưa dùng
# - tạo OTPRequest, gửi email OTP
# - trả { detail, debug_otp? }
#
# FE sau đó chuyển user sang màn hình nhập OTP.
# FE nhớ giữ tạm password & role để gửi lại ở bước confirm.
# =========================================================
class RegisterRequestOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = RegisterRequestOTPSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        email = ser.validated_data["email"].strip().lower()

        # tạo + gửi OTP
        otp_obj, sent_ok, debug_code = _create_and_send_otp(
            email=email,
            purpose="đăng ký tài khoản",
            ttl_minutes=5,
        )

        # Nếu celery gửi thành công -> không trả OTP
        # Nếu celery fail và DEBUG=True -> mình trả OTP để dev test
        resp = {
            "detail": "OTP đã được gửi tới email (hoặc trả trực tiếp nếu đang ở chế độ DEBUG).",
            "expires_at": otp_obj.expires_at,
        }
        if debug_code:
            resp["debug_otp"] = debug_code   # DEV ONLY

        return Response(resp, status=status.HTTP_200_OK)


# =========================================================
# 3. OTP đăng ký - bước 2:
#
# POST /api/accounts/register/confirm/
# body: { "email": "...", "otp": "123456", "password": "...", "role": "customer" }
#
# -> serializer sẽ:
#    - kiểm tra OTP còn hạn, chưa dùng
#    - tạo User (username = email), Profile(role)
#    - đánh dấu OTP used
#    - trả access/refresh
# =========================================================
class RegisterConfirmOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = RegisterConfirmOTPSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        created_payload = ser.save()
        return Response(created_payload, status=status.HTTP_201_CREATED)


# =========================================================
# 4. Login
#
# Bạn đang dùng TokenObtainPairView mặc định của SimpleJWT.
#
# Mặc định view này yêu cầu:
# {
#   "username": "...",
#   "password": "..."
# }
#
# Lưu ý: với flow OTP register ở trên, ta tạo user như:
#   username = email
# => FE chỉ cần gửi username = email, password = password.
#
# Nếu bạn muốn login bằng field "email" thay vì "username",
# bạn có 2 cách:
#   (a) FE gửi {"username": email, "password": "..."}  -> đơn giản nhất
#   (b) Tự viết serializer custom để map email -> username trước khi gọi authenticate
#
# Mình giữ cách (a) cho nhẹ.
# =========================================================
class LoginView(TokenObtainPairView):
    """ /api/accounts/login/ → access/refresh """
    permission_classes = [permissions.AllowAny]


# =========================================================
# 5. /api/accounts/me/
#
# GET kèm Authorization: Bearer <access_token>
# trả thông tin user + role
# =========================================================
class MeView(APIView):
    """Thông tin user hiện tại + role từ Profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = getattr(getattr(user, 'profile', None), 'role', 'customer')
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'role': role,
        }, status=status.HTTP_200_OK)


# =========================================================
# 6. Đăng ký Merchant
#
# POST /api/accounts/register_merchant/
# - Nếu CHƯA login:
#   {username,password,email?,name,address?,phone?}
#   -> tạo user + profile.role="merchant" + Merchant + MerchantMember
#   -> trả token
#
# - Nếu ĐÃ login (Bearer token):
#   {name,address?,phone?}
#   -> dùng user hiện tại, nâng role=merchant, tạo Merchant
#
# Trả user info + merchant info + JWT
# =========================================================
class RegisterMerchantView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = RegisterMerchantSerializer(
            data=request.data,
            context={"request": request},
        )
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        user, merchant = ser.save()

        payload = {
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": getattr(getattr(user, "profile", None), "role", "customer"),
            },
            "merchant": {
                "id": merchant.id,
                "name": merchant.name,
                "address": getattr(merchant, "address", ""),
                "phone": getattr(merchant, "phone", ""),
            },
        }

        # thêm JWT để FE merchant login ngay
        try:
            refresh = RefreshToken.for_user(user)
            payload.update({
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            })
        except Exception:
            pass

        return Response(payload, status=status.HTTP_201_CREATED)


# =========================================================
# 7. Danh sách merchant mà user hiện tại thuộc về
#
# GET /api/accounts/my_merchants/
# -> [{"id": ..., "name": "..."}]
# =========================================================
class MyMerchantsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Merchant.objects.filter(members__user=request.user).distinct()
        data = [{"id": m.id, "name": m.name} for m in qs]
        return Response(data, status=status.HTTP_200_OK)


# =========================================================
# 8A. Gửi OTP quên mật khẩu
#
# POST /api/accounts/forgot/request-otp/
# body: { "email": "..." }
#
# Nếu email tồn tại:
#   - tạo OTPRequest
#   - gửi email OTP (hoặc trả debug_otp nếu Celery fail + DEBUG=True)
#
# Nếu email KHÔNG tồn tại:
#   - vẫn trả 200 để tránh lộ thông tin user có tồn tại hay không
#
# FE sau đó sẽ điều hướng sang màn hình nhập OTP + mật khẩu mới.
# =========================================================
class ForgotPasswordRequestOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email_raw = request.data.get("email", "")
        email = (email_raw or "").strip().lower()

        debug_code = None
        expires_at = None

        if email and User.objects.filter(email__iexact=email).exists():
            otp_obj, sent_ok, debug_code = _create_and_send_otp(
                email=email,
                purpose="khôi phục mật khẩu",
                ttl_minutes=5,
            )
            expires_at = otp_obj.expires_at

        # Luôn trả 200
        resp = {
            "detail": "Nếu email tồn tại, OTP khôi phục mật khẩu đã được gửi.",
            "expires_at": expires_at,
        }
        if debug_code:
            resp["debug_otp"] = debug_code  # DEV ONLY

        return Response(resp, status=status.HTTP_200_OK)


# =========================================================
# 8B. Xác nhận OTP để đặt lại mật khẩu
#
# POST /api/accounts/reset-password/confirm/
# body: { "email": "...", "otp": "123456", "new_password": "..." }
#
# ResetPasswordConfirmSerializer:
#   - check OTP còn hạn
#   - set password mới
#   - mark OTP used
# =========================================================
class ResetPasswordConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        ser = ResetPasswordConfirmSerializer(data=request.data)
        if not ser.is_valid():
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

        result = ser.save()
        return Response(result, status=status.HTTP_200_OK)


# =========================================================
# 9. DEV ONLY: xem OTP gần đây
#
# GET /api/accounts/otp/debug/
# chỉ chạy khi DEBUG=True
# =========================================================
class OTPDebugListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        if not settings.DEBUG:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = OTPRequest.objects.order_by("-created_at")[:20]
        data = OTPRequestDebugSerializer(qs, many=True).data
        return Response(data, status=status.HTTP_200_OK)
