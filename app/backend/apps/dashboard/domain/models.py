"""
ダッシュボード集計ドメインモデル。
Django・DRF に一切依存しない純粋な Python クラスで定義する。
plans / tasks / study_logs の既存データを横断して集計した結果を表す。
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from uuid import UUID


class UnitStatus(str, Enum):
    """単元（タスク）の計画vs実績ステータス。"""

    COMPLETED = "completed"  # 計画日をすべて実績が満たしている
    DELAYED = "delayed"  # 未完了で、計画の終了日を過ぎている
    POSTPONED = "postponed"  # 未完了・未遅延だが、終了日が計画全体の目標日を超えている
    ON_TRACK = "on_track"  # 上記以外（現在進行中または今後の予定）
    UNSCHEDULED = "unscheduled"  # plan_dates が空で、まだ日程が組まれていない


@dataclass
class UnitProgress:
    """単元（タスク）1件分の計画vs実績。"""

    task_id: UUID
    title: str
    status: UnitStatus
    planned_days: int  # 計画日数（len(plan_dates)）
    studied_days: int  # 計画日のうち実績があった日数（plan_dates ∩ actual_dates）
    extra_days: int  # 計画外に学習した日数（actual_dates - plan_dates）
    completion_rate: float  # studied_days / planned_days（planned_days が 0 の場合は 0.0）


@dataclass
class PlanVsActual:
    """計画全体の計画vs実績サマリー。"""

    total_planned_days: int
    total_studied_days: int
    completion_rate: float
    completed_count: int
    delayed_count: int
    postponed_count: int
    on_track_count: int
    unscheduled_count: int
    units: list[UnitProgress]


@dataclass
class DashboardSummary:
    """ホーム画面向けサマリー。"""

    progress_percent: float  # 0〜100
    today_study_minutes: int
    streak_days: int
