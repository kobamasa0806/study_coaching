"""
学習計画リポジトリの抽象インターフェース。
infrastructure 層で具体実装を行う。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import date
from uuid import UUID

from .models import PlanStatus, StudyPlan


class AbstractPlanRepository(ABC):
    """学習計画リポジトリの抽象基底クラス。"""

    @abstractmethod
    def find_by_id(self, plan_id: UUID) -> StudyPlan | None:
        """ID で学習計画を検索する。"""
        ...

    @abstractmethod
    def find_by_user_id(self, user_id: UUID) -> list[StudyPlan]:
        """ユーザーIDに紐づく学習計画一覧を返す。"""
        ...

    @abstractmethod
    def create(
        self,
        user_id: UUID,
        title: str,
        description: str,
        target_date: date,
    ) -> StudyPlan:
        """新規学習計画を作成する。"""
        ...

    @abstractmethod
    def update(
        self,
        plan_id: UUID,
        title: str,
        description: str,
        target_date: date,
        status: PlanStatus,
    ) -> StudyPlan:
        """学習計画を更新する。"""
        ...

    @abstractmethod
    def delete(self, plan_id: UUID) -> None:
        """学習計画を削除する。"""
        ...
