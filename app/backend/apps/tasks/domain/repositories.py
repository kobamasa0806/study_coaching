"""
タスクリポジトリの抽象インターフェース。
infrastructure 層で具体実装を行う。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from uuid import UUID

from .models import Task, TaskStatus


class AbstractTaskRepository(ABC):
    """タスクリポジトリの抽象基底クラス。"""

    @abstractmethod
    def find_by_id(self, task_id: UUID) -> Task | None:
        """ID でタスクを検索する。"""
        ...

    @abstractmethod
    def find_by_plan_id(self, plan_id: UUID) -> list[Task]:
        """計画IDに紐づくタスク一覧を返す（order 昇順）。"""
        ...

    @abstractmethod
    def create(
        self,
        plan_id: UUID,
        title: str,
        description: str,
        plan_dates: list[str],
        actual_dates: list[str],
        order: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> Task:
        """新規タスクを作成する。"""
        ...

    @abstractmethod
    def update(
        self,
        task_id: UUID,
        title: str,
        description: str,
        plan_dates: list[str],
        actual_dates: list[str],
        status: TaskStatus,
        order: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> Task:
        """タスクを更新する。"""
        ...

    @abstractmethod
    def delete(self, task_id: UUID) -> None:
        """タスクを削除する。"""
        ...

    @abstractmethod
    def count_by_plan_id(self, plan_id: UUID) -> int:
        """計画IDに紐づくタスク数を返す。"""
        ...

    @abstractmethod
    def add_actual_date(self, task_id: UUID, date_str: str) -> None:
        """タスクの実績日付リストに日付を追加する（重複時はスキップ）。"""
        ...
