"""
勉強記録ユースケースの単体テスト。
リポジトリはモックを使用し、ビジネスロジック（集計・バリデーション）のみをテストする。
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timezone
from unittest.mock import MagicMock

import pytest

from apps.study_logs.application.use_cases import (
    CreateStudyLogCommand,
    CreateStudyLogUseCase,
    DeleteStudyLogUseCase,
    GetStudyLogStatsUseCase,
)
from apps.study_logs.domain.models import StudyLog


def _make_log(
    start: time,
    end: time,
    **kwargs,
) -> StudyLog:
    """テスト用 StudyLog エンティティを生成する。"""
    now = datetime.now(tz=timezone.utc)
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "task_id": uuid.uuid4(),
        "studied_on": date(2026, 6, 12),
        "start_time": start,
        "end_time": end,
        "memo": "",
        "created_at": now,
        "updated_at": now,
    }
    return StudyLog(**{**defaults, **kwargs})


class TestDurationMinutes:
    """duration_minutes プロパティのテスト。"""

    def test_通常の勉強時間(self):
        """14:30〜16:00 は 90 分。"""
        log = _make_log(time(14, 30), time(16, 0))
        assert log.duration_minutes == 90

    def test_日跨ぎの勉強時間(self):
        """23:00〜翌1:00 は 120 分として計算されること。"""
        log = _make_log(time(23, 0), time(1, 0))
        assert log.duration_minutes == 120


class TestHourlyDistribution:
    """hourly_distribution のテスト。"""

    def test_時間帯ごとに振り分けられる(self):
        """14:30〜16:00 は 14時=30分・15時=60分。"""
        log = _make_log(time(14, 30), time(16, 0))
        dist = log.hourly_distribution()
        assert dist[14] == 30
        assert dist[15] == 60
        assert sum(dist) == 90

    def test_日跨ぎは翌日の時間帯にも入る(self):
        """23:00〜翌1:00 は 23時=60分・0時=60分。"""
        log = _make_log(time(23, 0), time(1, 0))
        dist = log.hourly_distribution()
        assert dist[23] == 60
        assert dist[0] == 60
        assert sum(dist) == 120


class TestCreateStudyLogUseCase:
    """CreateStudyLogUseCase のテスト。"""

    def test_正常作成(self):
        """項目が計画に属し時刻が妥当なら作成されること。"""
        repo = MagicMock()
        repo.task_belongs_to_plan.return_value = True
        expected = _make_log(time(9, 0), time(10, 0))
        repo.create.return_value = expected

        use_case = CreateStudyLogUseCase(repo)
        result = use_case.execute(
            CreateStudyLogCommand(
                user_id=uuid.uuid4(),
                plan_id=uuid.uuid4(),
                task_id=uuid.uuid4(),
                studied_on=date(2026, 6, 12),
                start_time=time(9, 0),
                end_time=time(10, 0),
                memo="第1章",
            )
        )

        assert result is expected
        repo.create.assert_called_once()

    def test_項目が計画に属さない場合はエラー(self):
        """task_belongs_to_plan が False ならエラーになること。"""
        repo = MagicMock()
        repo.task_belongs_to_plan.return_value = False

        use_case = CreateStudyLogUseCase(repo)
        with pytest.raises(ValueError):
            use_case.execute(
                CreateStudyLogCommand(
                    user_id=uuid.uuid4(),
                    plan_id=uuid.uuid4(),
                    task_id=uuid.uuid4(),
                    studied_on=date(2026, 6, 12),
                    start_time=time(9, 0),
                    end_time=time(10, 0),
                    memo="",
                )
            )
        repo.create.assert_not_called()

    def test_開始終了が同時刻ならエラー(self):
        """開始と終了が同じ時刻ならエラーになること。"""
        repo = MagicMock()
        repo.task_belongs_to_plan.return_value = True

        use_case = CreateStudyLogUseCase(repo)
        with pytest.raises(ValueError):
            use_case.execute(
                CreateStudyLogCommand(
                    user_id=uuid.uuid4(),
                    plan_id=uuid.uuid4(),
                    task_id=uuid.uuid4(),
                    studied_on=date(2026, 6, 12),
                    start_time=time(9, 0),
                    end_time=time(9, 0),
                    memo="",
                )
            )
        repo.create.assert_not_called()


class TestDeleteStudyLogUseCase:
    """DeleteStudyLogUseCase のテスト。"""

    def test_正常削除(self):
        """存在し計画に属する記録は削除されること。"""
        repo = MagicMock()
        log = _make_log(time(9, 0), time(10, 0))
        repo.find_by_id.return_value = log
        repo.task_belongs_to_plan.return_value = True

        use_case = DeleteStudyLogUseCase(repo)
        use_case.execute(log_id=log.id, plan_id=uuid.uuid4())

        repo.delete.assert_called_once_with(log.id)

    def test_存在しない記録はエラー(self):
        """記録が見つからない場合はエラーになること。"""
        repo = MagicMock()
        repo.find_by_id.return_value = None

        use_case = DeleteStudyLogUseCase(repo)
        with pytest.raises(ValueError):
            use_case.execute(log_id=uuid.uuid4(), plan_id=uuid.uuid4())
        repo.delete.assert_not_called()

    def test_別計画の記録は削除できない(self):
        """別計画に属する記録の削除はエラーになること。"""
        repo = MagicMock()
        repo.find_by_id.return_value = _make_log(time(9, 0), time(10, 0))
        repo.task_belongs_to_plan.return_value = False

        use_case = DeleteStudyLogUseCase(repo)
        with pytest.raises(ValueError):
            use_case.execute(log_id=uuid.uuid4(), plan_id=uuid.uuid4())
        repo.delete.assert_not_called()


class TestGetStudyLogStatsUseCase:
    """GetStudyLogStatsUseCase のテスト。"""

    def test_合計と時間帯別を集計する(self):
        """複数記録の合計分数と時間帯別分布が集計されること。"""
        repo = MagicMock()
        repo.find_by_plan_id.return_value = [
            _make_log(time(9, 0), time(10, 0)),   # 9時=60分
            _make_log(time(9, 30), time(10, 0)),  # 9時=30分
            _make_log(time(22, 0), time(23, 0)),  # 22時=60分
        ]

        use_case = GetStudyLogStatsUseCase(repo)
        stats = use_case.execute(plan_id=uuid.uuid4())

        assert stats.total_minutes == 150
        assert stats.log_count == 3
        assert stats.hourly_minutes[9] == 90
        assert stats.hourly_minutes[22] == 60
        assert sum(stats.hourly_minutes) == 150

    def test_記録ゼロなら合計ゼロ(self):
        """記録がなければ合計0・全時間帯0になること。"""
        repo = MagicMock()
        repo.find_by_plan_id.return_value = []

        use_case = GetStudyLogStatsUseCase(repo)
        stats = use_case.execute(plan_id=uuid.uuid4())

        assert stats.total_minutes == 0
        assert stats.log_count == 0
        assert stats.hourly_minutes == [0] * 24
