"""
LINE Bot ドメインモデル。
Django / DRF に依存しない純粋な Python クラスで定義する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from enum import Enum
from uuid import UUID


class ConversationStateType(str, Enum):
    """LINE会話の状態を表す列挙型。"""

    IDLE = "idle"
    SELECTING_PLAN = "selecting_plan"
    SELECTING_TASK = "selecting_task"
    ENTERING_START_TIME = "entering_start_time"
    ENTERING_END_TIME = "entering_end_time"


@dataclass
class LineUserLink:
    """LINE ユーザーと Django ユーザーの紐付けエンティティ。"""

    id: UUID
    user_id: UUID
    line_user_id: str
    created_at: datetime


@dataclass
class ConversationState:
    """LINE 会話の状態エンティティ。会話の進行状況を追跡する。"""

    line_user_id: str
    state: ConversationStateType
    selected_plan_id: UUID | None
    selected_task_id: UUID | None
    # 開始時刻（"HH:MM" 形式）
    start_time: str | None
    study_date: date | None
    updated_at: datetime


@dataclass
class StudyRecord:
    """学習記録エンティティ。LINE Bot 経由で記録された学習セッション。"""

    id: UUID
    line_user_id: str
    # LINE アカウントと紐付けされた Django ユーザー（未紐付けの場合は None）
    user_id: UUID | None
    plan_id: UUID
    task_id: UUID
    study_date: date
    start_time: time
    end_time: time
    # 開始〜終了から計算した学習時間（分）
    duration_minutes: int
    # LINE Webhook を受信した日時
    responded_at: datetime
    created_at: datetime


@dataclass
class LinkCode:
    """LINE アカウント紐付け用の一時コードエンティティ。"""

    code: str
    user_id: UUID
    expires_at: datetime
    created_at: datetime
