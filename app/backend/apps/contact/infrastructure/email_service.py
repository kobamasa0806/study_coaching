"""
Django の send_mail を使ったメール送信実装。
"""
from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail

from apps.contact.domain.models import ContactInquiry
from apps.contact.domain.repositories import AbstractEmailService


class DjangoEmailService(AbstractEmailService):
    def send_contact_email(self, inquiry: ContactInquiry) -> None:
        subject = f"[ケンサン お問い合わせ] {inquiry.subject}"
        body = (
            f"お名前: {inquiry.name}\n"
            f"メールアドレス: {inquiry.email}\n"
            f"\n"
            f"---\n"
            f"{inquiry.message}"
        )
        send_mail(
            subject=subject,
            message=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.CONTACT_RECIPIENT_EMAIL],
            fail_silently=False,
        )
