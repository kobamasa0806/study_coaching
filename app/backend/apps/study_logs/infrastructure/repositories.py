"""
勉強記録リポジトリの Django ORM 実装。
"""
from __future__ import annotations

from datetime import date, time
from uuid import UUID

from apps.tasks.infrastructure.models import TaskModel

from ..domain.models import StudyLog
from ..domain.repositories import AbstractStudyLogRepository
from .models import StudyLogModel


class DjangoStudyLogRepository(AbstractStudyLogRepository):
    """Django ORM を使った勉強記録リポジトリ実装。"""

    def find_by_id(self, log_id: UUID) -> StudyLog | None:
        """ID で勉強記録を検索する。"""
        try:
            orm_log = StudyLogModel.objects.get(id=log_id)
            return self._to_entity(orm_log)
        except StudyLogModel.DoesNotExist:
            return None

    def find_by_plan_id(self, plan_id: UUID) -> list[StudyLog]:
        """指定した計画に属するタスクの勉強記録一覧を返す（モデルの ordering 順）。"""
        orm_logs = StudyLogModel.objects.filter(task__plan_id=plan_id)
        return [self._to_entity(log) for log in orm_logs]

    def create(
        self,
        user_id: UUID,
        task_id: UUID,
        studied_on: date,
        start_time: time,
        end_time: time,
        memo: str,
    ) -> StudyLog:
        """新規勉強記録を作成する。"""
        orm_log = StudyLogModel.objects.create(
            user_id=user_id,
            task_id=task_id,
            studied_on=studied_on,
            start_time=start_time,
            end_time=end_time,
            memo=memo,
        )
        return self._to_entity(orm_log)

    def delete(self, log_id: UUID) -> None:
        """勉強記録を削除する。"""
        StudyLogModel.objects.filter(id=log_id).delete()

    def task_belongs_to_plan(self, task_id: UUID, plan_id: UUID) -> bool:
        """指定したタスクが指定した計画に属するかを返す。"""
        return TaskModel.objects.filter(id=task_id, plan_id=plan_id).exists()

    def _to_entity(self, orm_log: StudyLogModel) -> StudyLog:
        """ORM モデルをドメインエンティティに変換する。"""
        return StudyLog(
            id=orm_log.id,
            user_id=orm_log.user_id,
            task_id=orm_log.task_id,
            studied_on=orm_log.studied_on,
            start_time=orm_log.start_time,
            end_time=orm_log.end_time,
            memo=orm_log.memo,
            created_at=orm_log.created_at,
            updated_at=orm_log.updated_at,
        )
