"""
学習計画ドメインモデル。
Django・DRF に一切依存しない純粋な Python クラスで定義する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum
from uuid import UUID


class PlanStatus(str, Enum):
    """学習計画のステータス。"""

    ACTIVE = "active"
    COMPLETED = "completed"
    ARCHIVED = "archived"


@dataclass
class StudyPlan:
    """学習計画エンティティ。"""

    id: UUID
    user_id: UUID
    title: str
    description: str
    target_date: date
    status: PlanStatus
    created_at: datetime
    updated_at: datetime
