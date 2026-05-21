"""
お問い合わせ送信ユースケース。
"""
from __future__ import annotations

from dataclasses import dataclass

from apps.contact.domain.models import ContactInquiry
from apps.contact.domain.repositories import AbstractEmailService


@dataclass(frozen=True)
class SendContactEmailCommand:
    name: str
    email: str
    subject: str
    message: str


class SendContactEmailUseCase:
    def __init__(self, email_service: AbstractEmailService) -> None:
        self._email_service = email_service

    def execute(self, command: SendContactEmailCommand) -> None:
        inquiry = ContactInquiry(
            name=command.name,
            email=command.email,
            subject=command.subject,
            message=command.message,
        )
        self._email_service.send_contact_email(inquiry)
