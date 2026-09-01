"""
タスクリポジトリの Django ORM 実装。
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from uuid import UUID

from apps.study_logs.infrastructure.models import StudyLogModel

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
        orm_tasks = list(TaskModel.objects.filter(plan_id=plan_id))
        actual_dates_map = self._get_actual_dates_map([t.id for t in orm_tasks])
        return [self._to_entity(t, actual_dates_map.get(t.id, [])) for t in orm_tasks]

    def create(
        self,
        plan_id: UUID,
        title: str,
        description: str,
        plan_dates: list[str],
        order: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> Task:
        """新規タスクを作成する。実績日付は StudyLog から導出されるため、作成時点では空になる。"""
        orm_task = TaskModel.objects.create(
            plan_id=plan_id,
            title=title,
            description=description,
            plan_dates=plan_dates,
            start_date=start_date,
            end_date=end_date,
            order=order,
        )
        return self._to_entity(orm_task, [])

    def update(
        self,
        task_id: UUID,
        title: str,
        description: str,
        plan_dates: list[str],
        status: TaskStatus,
        order: int,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> Task:
        """タスクを更新する。実績日付は StudyLog から導出されるため更新対象に含まない。"""
        TaskModel.objects.filter(id=task_id).update(
            title=title,
            description=description,
            plan_dates=plan_dates,
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

    def _to_entity(self, orm_task: TaskModel, actual_dates: list[str] | None = None) -> Task:
        """
        ORM モデルをドメインエンティティに変換する。
        actual_dates が指定されなければ、この場で StudyLog から導出する。
        """
        if actual_dates is None:
            actual_dates = self._get_actual_dates_map([orm_task.id]).get(orm_task.id, [])
        return Task(
            id=orm_task.id,
            plan_id=orm_task.plan_id,
            title=orm_task.title,
            description=orm_task.description,
            start_date=orm_task.start_date,
            end_date=orm_task.end_date,
            plan_dates=orm_task.plan_dates or [],
            actual_dates=actual_dates,
            status=TaskStatus(orm_task.status),
            order=orm_task.order,
            created_at=orm_task.created_at,
            updated_at=orm_task.updated_at,
        )

    def _get_actual_dates_map(self, task_ids: list[UUID]) -> dict[UUID, list[str]]:
        """
        タスクIDごとの実績日付（"yyyy-MM-dd" 形式・重複排除・昇順）を StudyLog から導出する。
        実績は勉強記録（StudyLog）を追加/削除したときのみ反映されるべきものであり、
        Task 側に直接書き込ませないことでこれを保証する。
        """
        if not task_ids:
            return {}
        rows = (
            StudyLogModel.objects.filter(task_id__in=task_ids)
            .values_list("task_id", "studied_on")
            .distinct()
        )
        grouped: dict[UUID, set[str]] = defaultdict(set)
        for task_id, studied_on in rows:
            grouped[task_id].add(studied_on.isoformat())
        return {task_id: sorted(dates) for task_id, dates in grouped.items()}
