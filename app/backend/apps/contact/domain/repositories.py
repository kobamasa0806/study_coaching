"""
お問い合わせメール送信のリポジトリインターフェース。
"""
from __future__ import annotations

from abc import ABC, abstractmethod

from .models import ContactInquiry


class AbstractEmailService(ABC):
    """メール送信サービスの抽象クラス。"""

    @abstractmethod
    def send_contact_email(self, inquiry: ContactInquiry) -> None:
        """お問い合わせメールを送信する。"""
        ...
