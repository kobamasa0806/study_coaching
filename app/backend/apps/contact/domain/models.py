"""
お問い合わせドメインモデル。
外部ライブラリに依存しない純粋な Python クラスとして定義する。
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ContactInquiry:
    """お問い合わせの値オブジェクト。"""

    name: str
    email: str
    subject: str
    message: str
