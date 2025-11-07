# backend/accounts/urls.py

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    MeView,
    RegisterMerchantView,
    MyMerchantsView,

    # OTP register
    RegisterRequestOTPView,
    RegisterConfirmOTPView,

    # Forgot password (OTP reset pass)
    ForgotPasswordRequestOTPView,
    ResetPasswordConfirmView,

    # Dev debug OTP list
    OTPDebugListView,
)

urlpatterns = [
    # =============== AUTH CƠ BẢN (bạn đã có) ===============
    path('register/',          RegisterView.as_view(),         name='register'),
    path('login/',             LoginView.as_view(),            name='token_obtain_pair'),
    path('me/',                MeView.as_view(),               name='me'),

    # refresh access token từ refresh token (JWT chuẩn)
    path('token/refresh/',     TokenRefreshView.as_view(),     name='token_refresh'),

    # =============== MERCHANT FLOW (bạn đã có) ===============
    path('register_merchant/', RegisterMerchantView.as_view(), name='register-merchant'),
    path('my_merchants/',      MyMerchantsView.as_view(),      name='my-merchants'),

    # =============== ĐĂNG KÝ BẰNG OTP (2 bước) ===============
    # Bước 1: xin OTP để đăng ký tài khoản mới
    path('register/request-otp/',  RegisterRequestOTPView.as_view(), name='register-request-otp'),
    # Bước 2: confirm OTP -> tạo User + Profile + tokens
    path('register/confirm/',      RegisterConfirmOTPView.as_view(), name='register-confirm-otp'),

    # =============== QUÊN MẬT KHẨU / RESET PASS BẰNG OTP ===============
    # Bước 1: xin OTP để quên mật khẩu
    path('forgot/request-otp/',    ForgotPasswordRequestOTPView.as_view(), name='forgot-request-otp'),
    # Bước 2: confirm OTP + đặt mật khẩu mới
    path('reset-password/confirm/', ResetPasswordConfirmView.as_view(),    name='reset-password-confirm'),

    # =============== DEBUG OTP (DEV ONLY) ===============
    path('otp/debug/',          OTPDebugListView.as_view(),    name='otp-debug'),
]
