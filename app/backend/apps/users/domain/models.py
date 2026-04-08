"""
ユーザードメインモデル。
Django・DRF に一切依存しない純粋な Python クラスで定義する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class User:
    """ユーザーエンティティ。"""

    id: UUID
    email: str
    username: str
    is_active: bool
    created_at: datetime
    cognito_sub: str | None = None  # AWS Cognito ユーザー ID（sub クレーム）
