"""
タスク関連のユースケース。
ビジネスロジックをここに集約する。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from uuid import UUID

from ..domain.models import Task, TaskStatus
from ..domain.repositories import AbstractTaskRepository


@dataclass
class CreateTaskCommand:
    """タスク作成コマンド。"""

    plan_id: UUID
    title: str
    description: str
    plan_dates: list[str] = field(default_factory=list)
    actual_dates: list[str] = field(default_factory=list)
    start_date: date | None = None
    end_date: date | None = None


@dataclass
class UpdateTaskCommand:
    """タスク更新コマンド。"""

    task_id: UUID
    plan_id: UUID
    title: str
    description: str
    plan_dates: list[str]
    actual_dates: list[str]
    status: TaskStatus
    order: int
    start_date: date | None = None
    end_date: date | None = None


class CreateTaskUseCase:
    """タスク作成ユースケース。"""

    def __init__(self, task_repository: AbstractTaskRepository) -> None:
        self._task_repository = task_repository

    def execute(self, command: CreateTaskCommand) -> Task:
        """
        新規タスクを作成する。
        order は既存タスク数 + 1 を自動設定する。
        start_date/end_date が未指定の場合は plan_dates の最小・最大日から導出する。
        """
        start_date = command.start_date
        end_date = command.end_date
        if command.plan_dates and start_date is None:
            sorted_dates = sorted(command.plan_dates)
            start_date = date.fromisoformat(sorted_dates[0])
            end_date = date.fromisoformat(sorted_dates[-1])

        order = self._task_repository.count_by_plan_id(command.plan_id) + 1
        return self._task_repository.create(
            plan_id=command.plan_id,
            title=command.title,
            description=command.description,
            plan_dates=command.plan_dates,
            actual_dates=command.actual_dates,
            order=order,
            start_date=start_date,
            end_date=end_date,
        )


class ListTasksUseCase:
    """タスク一覧取得ユースケース。"""

    def __init__(self, task_repository: AbstractTaskRepository) -> None:
        self._task_repository = task_repository

    def execute(self, plan_id: UUID) -> list[Task]:
        """計画に紐づくタスク一覧を order 昇順で返す。"""
        return self._task_repository.find_by_plan_id(plan_id)


class GetTaskUseCase:
    """タスク詳細取得ユースケース。"""

    def __init__(self, task_repository: AbstractTaskRepository) -> None:
        self._task_repository = task_repository

    def execute(self, task_id: UUID, plan_id: UUID) -> Task:
        """
        指定したタスクを返す。
        存在しない場合または計画IDが一致しない場合は ValueError を送出する。
        """
        task = self._task_repository.find_by_id(task_id)
        if task is None:
            raise ValueError("タスクが見つかりません。")
        if task.plan_id != plan_id:
            raise ValueError("タスクが見つかりません。")
        return task


class UpdateTaskUseCase:
    """タスク更新ユースケース。"""

    def __init__(self, task_repository: AbstractTaskRepository) -> None:
        self._task_repository = task_repository

    def execute(self, command: UpdateTaskCommand) -> Task:
        """
        タスクを更新する。
        存在しない場合または計画IDが一致しない場合は ValueError を送出する。
        """
        task = self._task_repository.find_by_id(command.task_id)
        if task is None:
            raise ValueError("タスクが見つかりません。")
        if task.plan_id != command.plan_id:
            raise ValueError("タスクが見つかりません。")

        # plan_dates から start_date/end_date を導出する
        start_date = command.start_date
        end_date = command.end_date
        if command.plan_dates and start_date is None:
            sorted_dates = sorted(command.plan_dates)
            start_date = date.fromisoformat(sorted_dates[0])
            end_date = date.fromisoformat(sorted_dates[-1])

        return self._task_repository.update(
            task_id=command.task_id,
            title=command.title,
            description=command.description,
            plan_dates=command.plan_dates,
            actual_dates=command.actual_dates,
            status=command.status,
            order=command.order,
            start_date=start_date,
            end_date=end_date,
        )


class DeleteTaskUseCase:
    """タスク削除ユースケース。"""

    def __init__(self, task_repository: AbstractTaskRepository) -> None:
        self._task_repository = task_repository

    def execute(self, task_id: UUID, plan_id: UUID) -> None:
        """
        タスクを削除する。
        存在しない場合または計画IDが一致しない場合は ValueError を送出する。
        """
        task = self._task_repository.find_by_id(task_id)
        if task is None:
            raise ValueError("タスクが見つかりません。")
        if task.plan_id != plan_id:
            raise ValueError("タスクが見つかりません。")

        self._task_repository.delete(task_id)
