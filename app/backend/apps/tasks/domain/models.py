"""
タスクドメインモデル。
Django・DRF に一切依存しない純粋な Python クラスで定義する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class TaskStatus(str, Enum):
    """タスクのステータス。"""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


@dataclass
class Task:
    """タスクエンティティ（ガントチャートの各要素）。"""

    id: UUID
    plan_id: UUID
    title: str
    description: str
    start_date: date | None
    end_date: date | None
    # ガントチャート用：個別の日付を保持する（"yyyy-MM-dd" 形式の文字列リスト）
    plan_dates: list[str]
    actual_dates: list[str]
    status: TaskStatus
    order: int
    created_at: datetime
    updated_at: datetime
