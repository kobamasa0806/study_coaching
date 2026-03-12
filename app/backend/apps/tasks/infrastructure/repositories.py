"""
タスクリポジトリの Django ORM 実装。
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from ..domain.models import Task, TaskStatus
from ..domain.repositories import AbstractTaskRepository
from .models import TaskModel


class DjangoTaskRepository(AbstractTaskRepository):
    """Django ORM を使ったタスクリポジトリ実装。"""

    def find_by_id(self, task_id: UUID) -> Task | None:
        """ID でタスクを検索する。"""
        try:
            orm_task = TaskModel.objects.get(id=task_id)
            return self._to_entity(orm_task)
        except TaskModel.DoesNotExist:
            return None

    def find_by_plan_id(self, plan_id: UUID) -> list[Task]:
        """計画IDに紐づくタスク一覧を order 昇順で返す。"""
        orm_tasks = TaskModel.objects.filter(plan_id=plan_id)
        return [self._to_entity(t) for t in orm_tasks]

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
        orm_task = TaskModel.objects.create(
            plan_id=plan_id,
            title=title,
            description=description,
            plan_dates=plan_dates,
            actual_dates=actual_dates,
            start_date=start_date,
            end_date=end_date,
            order=order,
        )
        return self._to_entity(orm_task)

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
        TaskModel.objects.filter(id=task_id).update(
            title=title,
            description=description,
            plan_dates=plan_dates,
            actual_dates=actual_dates,
            start_date=start_date,
            end_date=end_date,
            status=status.value,
            order=order,
        )
        orm_task = TaskModel.objects.get(id=task_id)
        return self._to_entity(orm_task)

    def delete(self, task_id: UUID) -> None:
        """タスクを削除する。"""
        TaskModel.objects.filter(id=task_id).delete()

    def count_by_plan_id(self, plan_id: UUID) -> int:
        """計画IDに紐づくタスク数を返す。"""
        return TaskModel.objects.filter(plan_id=plan_id).count()

    def _to_entity(self, orm_task: TaskModel) -> Task:
        """ORM モデルをドメインエンティティに変換する。"""
        return Task(
            id=orm_task.id,
            plan_id=orm_task.plan_id,
            title=orm_task.title,
            description=orm_task.description,
            start_date=orm_task.start_date,
            end_date=orm_task.end_date,
            plan_dates=orm_task.plan_dates or [],
            actual_dates=orm_task.actual_dates or [],
            status=TaskStatus(orm_task.status),
            order=orm_task.order,
            created_at=orm_task.created_at,
            updated_at=orm_task.updated_at,
        )
