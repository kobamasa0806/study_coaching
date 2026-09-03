"""
ダッシュボード集計関連のユースケース。
plans / tasks / study_logs の既存リポジトリ抽象を組み合わせて集計する。
「今日」の日付は呼び出し側（presentation層）から渡し、ユースケース自体は
時刻情報に依存しない（テスト容易性のため）。
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from apps.plans.domain.repositories import AbstractPlanRepository
from apps.study_logs.domain.repositories import AbstractStudyLogRepository
from apps.tasks.domain.repositories import AbstractTaskRepository

from ..domain.models import DashboardSummary, PlanVsActual, UnitProgress, UnitStatus
from ..domain.services import classify_unit, compute_streak


class GetDashboardSummaryUseCase:
    """ホーム画面向けサマリー（進捗率・今日の学習時間・連続学習日数）取得ユースケース。"""

    def __init__(
        self,
        task_repository: AbstractTaskRepository,
        study_log_repository: AbstractStudyLogRepository,
    ) -> None:
        self._task_repository = task_repository
        self._study_log_repository = study_log_repository

    def execute(self, plan_id: UUID, today: date) -> DashboardSummary:
        tasks = self._task_repository.find_by_plan_id(plan_id)
        logs = self._study_log_repository.find_by_plan_id(plan_id)

        total_planned_days = sum(len(task.plan_dates) for task in tasks)
        total_studied_days = sum(
            len(set(task.plan_dates) & set(task.actual_dates)) for task in tasks
        )
        progress_percent = (
            total_studied_days / total_planned_days * 100
            if total_planned_days > 0
            else 0.0
        )

        today_study_minutes = sum(
            log.duration_minutes for log in logs if log.studied_on == today
        )
        studied_dates = {log.studied_on for log in logs}
        streak_days = compute_streak(studied_dates, today)

        return DashboardSummary(
            progress_percent=progress_percent,
            today_study_minutes=today_study_minutes,
            streak_days=streak_days,
        )


class GetPlanVsActualUseCase:
    """計画画面向け計画vs実績（単元別内訳を含む）取得ユースケース。"""

    def __init__(
        self,
        plan_repository: AbstractPlanRepository,
        task_repository: AbstractTaskRepository,
    ) -> None:
        self._plan_repository = plan_repository
        self._task_repository = task_repository

    def execute(self, plan_id: UUID, today: date) -> PlanVsActual:
        plan = self._plan_repository.find_by_id(plan_id)
        if plan is None:
            raise ValueError("学習計画が見つかりません。")

        tasks = self._task_repository.find_by_plan_id(plan_id)

        units: list[UnitProgress] = []
        status_counts = {status: 0 for status in UnitStatus}
        total_planned_days = 0
        total_studied_days = 0

        for task in tasks:
            unit_status = classify_unit(
                task.plan_dates, task.actual_dates, plan.target_date, today
            )
            planned_days = len(task.plan_dates)
            studied_days = len(set(task.plan_dates) & set(task.actual_dates))
            extra_days = len(set(task.actual_dates) - set(task.plan_dates))
            completion_rate = studied_days / planned_days if planned_days > 0 else 0.0

            units.append(
                UnitProgress(
                    task_id=task.id,
                    title=task.title,
                    status=unit_status,
                    planned_days=planned_days,
                    studied_days=studied_days,
                    extra_days=extra_days,
                    completion_rate=completion_rate,
                )
            )

            status_counts[unit_status] += 1
            total_planned_days += planned_days
            total_studied_days += studied_days

        completion_rate = (
            total_studied_days / total_planned_days if total_planned_days > 0 else 0.0
        )

        return PlanVsActual(
            total_planned_days=total_planned_days,
            total_studied_days=total_studied_days,
            completion_rate=completion_rate,
            completed_count=status_counts[UnitStatus.COMPLETED],
            delayed_count=status_counts[UnitStatus.DELAYED],
            postponed_count=status_counts[UnitStatus.POSTPONED],
            on_track_count=status_counts[UnitStatus.ON_TRACK],
            unscheduled_count=status_counts[UnitStatus.UNSCHEDULED],
            units=units,
        )
