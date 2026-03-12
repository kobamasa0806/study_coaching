"""
タスクユースケースの単体テスト。
リポジトリはモックを使用し、ビジネスロジックのみをテストする。
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from apps.tasks.application.use_cases import (
    CreateTaskCommand,
    CreateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskUseCase,
    UpdateTaskCommand,
    UpdateTaskUseCase,
)
from apps.tasks.domain.models import Task, TaskStatus


def _make_task(**kwargs) -> Task:
    """テスト用 Task エンティティを生成する。"""
    now = datetime.now(tz=timezone.utc)
    defaults = {
        "id": uuid.uuid4(),
        "plan_id": uuid.uuid4(),
        "title": "テストタスク",
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


class TestCreateTaskUseCase:
    """CreateTaskUseCase のテスト。"""

    def test_正常作成(self):
        """正しいコマンドでタスクが作成されること。"""
        repo = MagicMock()
        plan_id = uuid.uuid4()
        repo.count_by_plan_id.return_value = 2  # 既存タスク2件 → order=3
        expected = _make_task(plan_id=plan_id, order=3)
        repo.create.return_value = expected

        use_case = CreateTaskUseCase(repo)
        command = CreateTaskCommand(
            plan_id=plan_id,
            title="新しいタスク",
            description="",
        )

        result = use_case.execute(command)

        assert result == expected
        # order が既存タスク数 + 1 になっていることを確認
        _, kwargs = repo.create.call_args
        assert kwargs["order"] == 3

    def test_plan_datesからstart_end_dateを導出(self):
        """plan_dates が指定された場合、start_date/end_date が自動導出されること。"""
        repo = MagicMock()
        repo.count_by_plan_id.return_value = 0
        repo.create.return_value = _make_task()

        use_case = CreateTaskUseCase(repo)
        command = CreateTaskCommand(
            plan_id=uuid.uuid4(),
            title="タスク",
            description="",
            plan_dates=["2026-04-01", "2026-04-03", "2026-04-02"],
        )

        use_case.execute(command)

        _, kwargs = repo.create.call_args
        from datetime import date
        assert kwargs["start_date"] == date(2026, 4, 1)
        assert kwargs["end_date"] == date(2026, 4, 3)


class TestGetTaskUseCase:
    """GetTaskUseCase のテスト。"""

    def test_正常取得(self):
        """存在するタスクを正しい plan_id で取得できること。"""
        repo = MagicMock()
        plan_id = uuid.uuid4()
        task = _make_task(plan_id=plan_id)
        repo.find_by_id.return_value = task

        use_case = GetTaskUseCase(repo)
        result = use_case.execute(task_id=task.id, plan_id=plan_id)

        assert result == task

    def test_存在しないタスクでValueError(self):
        """存在しないタスクIDを指定した場合、ValueError が発生すること。"""
        repo = MagicMock()
        repo.find_by_id.return_value = None

        use_case = GetTaskUseCase(repo)

        with pytest.raises(ValueError, match="見つかりません"):
            use_case.execute(task_id=uuid.uuid4(), plan_id=uuid.uuid4())

    def test_別計画のタスクでValueError(self):
        """別の計画に属するタスクを指定した場合、ValueError が発生すること。"""
        repo = MagicMock()
        task = _make_task(plan_id=uuid.uuid4())
        repo.find_by_id.return_value = task

        use_case = GetTaskUseCase(repo)

        with pytest.raises(ValueError, match="見つかりません"):
            use_case.execute(task_id=task.id, plan_id=uuid.uuid4())


class TestUpdateTaskUseCase:
    """UpdateTaskUseCase のテスト。"""

    def test_正常更新(self):
        """タスクが正常に更新されること。"""
        repo = MagicMock()
        plan_id = uuid.uuid4()
        task = _make_task(plan_id=plan_id)
        updated = _make_task(plan_id=plan_id, title="更新後")
        repo.find_by_id.return_value = task
        repo.update.return_value = updated

        use_case = UpdateTaskUseCase(repo)
        command = UpdateTaskCommand(
            task_id=task.id,
            plan_id=plan_id,
            title="更新後",
            description="",
            plan_dates=[],
            actual_dates=[],
            status=TaskStatus.IN_PROGRESS,
            order=1,
        )

        result = use_case.execute(command)

        assert result == updated
        repo.update.assert_called_once()

    def test_別計画のタスク更新でValueError(self):
        """別の計画のタスクを更新しようとした場合、ValueError が発生すること。"""
        repo = MagicMock()
        task = _make_task(plan_id=uuid.uuid4())
        repo.find_by_id.return_value = task

        use_case = UpdateTaskUseCase(repo)
        command = UpdateTaskCommand(
            task_id=task.id,
            plan_id=uuid.uuid4(),  # 別の計画
            title="更新",
            description="",
            plan_dates=[],
            actual_dates=[],
            status=TaskStatus.PENDING,
            order=1,
        )

        with pytest.raises(ValueError, match="見つかりません"):
            use_case.execute(command)
        repo.update.assert_not_called()


class TestDeleteTaskUseCase:
    """DeleteTaskUseCase のテスト。"""

    def test_正常削除(self):
        """タスクが正常に削除されること。"""
        repo = MagicMock()
        plan_id = uuid.uuid4()
        task = _make_task(plan_id=plan_id)
        repo.find_by_id.return_value = task

        use_case = DeleteTaskUseCase(repo)
        use_case.execute(task_id=task.id, plan_id=plan_id)

        repo.delete.assert_called_once_with(task.id)

    def test_存在しないタスク削除でValueError(self):
        """存在しないタスクを削除しようとした場合、ValueError が発生すること。"""
        repo = MagicMock()
        repo.find_by_id.return_value = None

        use_case = DeleteTaskUseCase(repo)

        with pytest.raises(ValueError, match="見つかりません"):
            use_case.execute(task_id=uuid.uuid4(), plan_id=uuid.uuid4())
