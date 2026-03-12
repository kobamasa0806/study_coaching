"""
1on1 セッションドメインモデル。
Django・DRF に一切依存しない純粋な Python クラスで定義する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from uuid import UUID


class SessionStatus(str, Enum):
    """セッションのステータス。"""

    SCHEDULED = "scheduled"    # 予定済み
    COMPLETED = "completed"    # 完了
    CANCELLED = "cancelled"    # キャンセル


@dataclass
class Session:
    """1on1 セッションエンティティ。"""

    id: UUID
    user_id: UUID
    scheduled_at: datetime
    memo: str        # 事前メモ（アジェンダ・相談事項）
    summary: str     # セッション後のまとめ
    status: SessionStatus
    created_at: datetime
    updated_at: datetime
