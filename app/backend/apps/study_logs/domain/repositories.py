"""
勉強記録リポジトリの抽象インターフェース。
infrastructure 層で具体実装を行う。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date, time
from uuid import UUID

from .models import StudyLog


class AbstractStudyLogRepository(ABC):
    """勉強記録リポジトリの抽象基底クラス。"""

    @abstractmethod
    def find_by_id(self, log_id: UUID) -> StudyLog | None:
        """ID で勉強記録を検索する。"""
        ...

    @abstractmethod
    def find_by_plan_id(self, plan_id: UUID) -> list[StudyLog]:
        """指定した計画に属するタスクの勉強記録一覧を返す（日付・開始時刻の降順）。"""
        ...

    @abstractmethod
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
        ...

    @abstractmethod
    def delete(self, log_id: UUID) -> None:
        """勉強記録を削除する。"""
        ...

    @abstractmethod
    def task_belongs_to_plan(self, task_id: UUID, plan_id: UUID) -> bool:
        """指定したタスクが指定した計画に属するかを返す。"""
        ...
