# backend/accounts/tasks.py

from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task(bind=True, max_retries=3)
def send_otp_email(self, email: str, code: str):
    """
    Gửi OTP qua email cho user.
    Chạy trong celery_worker container.
    Sử dụng SMTP Gmail đã cấu hình qua biến môi trường:
      EMAIL_HOST, EMAIL_PORT, EMAIL_HOST_USER, EMAIL_HOST_PASSWORD, ...
    """
    subject = "Mã OTP xác thực tài khoản FastFood"
    message = (
        f"Chào bạn,\n\n"
        f"Mã OTP của bạn là: {code}\n"
        f"Mã này sẽ hết hạn sau 5 phút.\n\n"
        f"Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.\n\n"
        f"Cảm ơn!"
    )

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", settings.EMAIL_HOST_USER)
    recipient_list = [email]

    # Gửi email. Nếu lỗi tạm thời (SMTP refuse...), Celery có thể retry.
    try:
        send_mail(
            subject,
            message,
            from_email,
            recipient_list,
            fail_silently=False,
        )
        return {"status": "sent", "to": email}
    except Exception as exc:
        # Celery retry (exponential backoff basic)
        raise self.retry(exc=exc, countdown=5)
