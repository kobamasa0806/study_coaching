"""
ダッシュボード集計ユースケースの単体テスト。
リポジトリはモックを使用し、集計ロジックのみをテストする。
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone
from unittest.mock import MagicMock

import pytest

from apps.dashboard.application.use_cases import (
    GetDashboardSummaryUseCase,
    GetPlanVsActualUseCase,
)
from apps.dashboard.domain.models import UnitStatus
from apps.plans.domain.models import PlanStatus, StudyPlan
from apps.study_logs.domain.models import StudyLog
from apps.tasks.domain.models import Task, TaskStatus


def _make_task(**kwargs) -> Task:
    """テスト用 Task エンティティを生成する。"""
    now = datetime.now(tz=timezone.utc)
    defaults = {
        "id": uuid.uuid4(),
        "plan_id": uuid.uuid4(),
        "title": "第1章",
        "description": "",
        "start_date": None,
        "end_date": None,
        "plan_dates": [],
        "actual_dates": [],
        "status": TaskStatus.PENDING,
        "order": 1,
        "created_at": now,
        "updated_at": now,
    }
    return Task(**{**defaults, **kwargs})


def _make_log(**kwargs) -> StudyLog:
    """テスト用 StudyLog エンティティを生成する（デフォルトは60分の記録）。"""
    now = datetime.now(tz=timezone.utc)
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "task_id": uuid.uuid4(),
        "studied_on": date(2026, 1, 10),
        "start_time": time(9, 0),
        "end_time": time(10, 0),
        "memo": "",
        "created_at": now,
        "updated_at": now,
    }
    return StudyLog(**{**defaults, **kwargs})


def _make_plan(**kwargs) -> StudyPlan:
    """テスト用 StudyPlan エンティティを生成する。"""
    now = datetime.now(tz=timezone.utc)
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "title": "テスト計画",
        "description": "",
        "target_date": date(2026, 6, 30),
        "status": PlanStatus.ACTIVE,
        "created_at": now,
        "updated_at": now,
    }
    return StudyPlan(**{**defaults, **kwargs})


class TestGetDashboardSummaryUseCase:
    """GetDashboardSummaryUseCase のテスト。"""

    def test_進捗率と今日の学習時間と連続日数を集計する(self):
        """タスク・学習記録から進捗率・今日の学習時間・連続学習日数を正しく集計すること。"""
        plan_id = uuid.uuid4()
        task_repo = MagicMock()
        study_log_repo = MagicMock()
        task_repo.find_by_plan_id.return_value = [
            _make_task(plan_dates=["2026-01-09", "2026-01-10"], actual_dates=["2026-01-09"]),
            _make_task(plan_dates=["2026-01-11"], actual_dates=[]),
        ]
        study_log_repo.find_by_plan_id.return_value = [
            _make_log(studied_on=date(2026, 1, 10), start_time=time(9, 0), end_time=time(10, 30)),
            _make_log(studied_on=date(2026, 1, 9), start_time=time(9, 0), end_time=time(9, 30)),
        ]

        use_case = GetDashboardSummaryUseCase(task_repo, study_log_repo)
        result = use_case.execute(plan_id=plan_id, today=date(2026, 1, 10))

        # total_planned_days=3, total_studied_days=1(plan_dates∩actual_datesは1件目のみ) -> 1/3*100
        assert result.progress_percent == pytest.approx(100 / 3)
        assert result.today_study_minutes == 90
        assert result.streak_days == 2  # 1/9, 1/10 の連続記録

    def test_計画日が0件なら進捗率は0(self):
        """タスクの plan_dates がすべて空の場合、ゼロ除算せず 0.0 になること。"""
        task_repo = MagicMock()
        study_log_repo = MagicMock()
        task_repo.find_by_plan_id.return_value = [_make_task(plan_dates=[], actual_dates=[])]
        study_log_repo.find_by_plan_id.return_value = []

        use_case = GetDashboardSummaryUseCase(task_repo, study_log_repo)
        result = use_case.execute(plan_id=uuid.uuid4(), today=date(2026, 1, 10))

        assert result.progress_percent == 0.0
        assert result.today_study_minutes == 0
        assert result.streak_days == 0


class TestGetPlanVsActualUseCase:
    """GetPlanVsActualUseCase のテスト。"""

    def test_計画が存在しなければValueError(self):
        """計画が見つからない場合、ValueError が発生すること。"""
        plan_repo = MagicMock()
        task_repo = MagicMock()
        plan_repo.find_by_id.return_value = None

        use_case = GetPlanVsActualUseCase(plan_repo, task_repo)

        with pytest.raises(ValueError, match="見つかりません"):
            use_case.execute(plan_id=uuid.uuid4(), today=date(2026, 1, 10))

    def test_単元ごとのステータスと件数を集計する(self):
        """各単元を分類し、件数・進捗率を正しく集計すること。"""
        plan = _make_plan(target_date=date(2026, 6, 30))
        plan_repo = MagicMock()
        task_repo = MagicMock()
        plan_repo.find_by_id.return_value = plan
        task_repo.find_by_plan_id.return_value = [
            # COMPLETED: 計画日をすべて実績が満たす
            _make_task(plan_dates=["2026-01-01"], actual_dates=["2026-01-01"]),
            # DELAYED: 未完了・終了日が今日より過去
            _make_task(plan_dates=["2026-01-01"], actual_dates=[]),
            # UNSCHEDULED: 計画日なし
            _make_task(plan_dates=[], actual_dates=[]),
        ]

        use_case = GetPlanVsActualUseCase(plan_repo, task_repo)
        result = use_case.execute(plan_id=plan.id, today=date(2026, 1, 10))

        assert result.completed_count == 1
        assert result.delayed_count == 1
        assert result.unscheduled_count == 1
        assert result.postponed_count == 0
        assert result.on_track_count == 0
        assert len(result.units) == 3
        assert result.total_planned_days == 2
        assert result.total_studied_days == 1
        assert result.completion_rate == pytest.approx(0.5)

    def test_単元が0件なら完了率は0(self):
        """タスクが1件もない場合、ゼロ除算せず completion_rate が 0.0 になること。"""
        plan = _make_plan()
        plan_repo = MagicMock()
        task_repo = MagicMock()
        plan_repo.find_by_id.return_value = plan
        task_repo.find_by_plan_id.return_value = []

        use_case = GetPlanVsActualUseCase(plan_repo, task_repo)
        result = use_case.execute(plan_id=plan.id, today=date(2026, 1, 10))

        assert result.completion_rate == 0.0
        assert result.units == []
