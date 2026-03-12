"""
学習計画リポジトリの Django ORM 実装。
"""
from __future__ import annotations

from datetime import date
from uuid import UUID

from ..domain.models import PlanStatus, StudyPlan
from ..domain.repositories import AbstractPlanRepository
from .models import PlanModel


class DjangoPlanRepository(AbstractPlanRepository):
    """Django ORM を使った学習計画リポジトリ実装。"""

    def find_by_id(self, plan_id: UUID) -> StudyPlan | None:
        """ID で学習計画を検索する。"""
        try:
            orm_plan = PlanModel.objects.get(id=plan_id)
            return self._to_entity(orm_plan)
        except PlanModel.DoesNotExist:
            return None

    def find_by_user_id(self, user_id: UUID) -> list[StudyPlan]:
        """ユーザーIDに紐づく学習計画一覧を返す。"""
        orm_plans = PlanModel.objects.filter(user_id=user_id)
        return [self._to_entity(p) for p in orm_plans]

    def create(
        self,
        user_id: UUID,
        title: str,
        description: str,
        target_date: date,
    ) -> StudyPlan:
        """新規学習計画を作成する。"""
        orm_plan = PlanModel.objects.create(
            user_id=user_id,
            title=title,
            description=description,
            target_date=target_date,
        )
        return self._to_entity(orm_plan)

    def update(
        self,
        plan_id: UUID,
        title: str,
        description: str,
        target_date: date,
        status: PlanStatus,
    ) -> StudyPlan:
        """学習計画を更新する。"""
        PlanModel.objects.filter(id=plan_id).update(
            title=title,
            description=description,
            target_date=target_date,
            status=status.value,
        )
        orm_plan = PlanModel.objects.get(id=plan_id)
        return self._to_entity(orm_plan)

    def delete(self, plan_id: UUID) -> None:
        """学習計画を削除する。"""
        PlanModel.objects.filter(id=plan_id).delete()

    def _to_entity(self, orm_plan: PlanModel) -> StudyPlan:
        """ORM モデルをドメインエンティティに変換する。"""
        return StudyPlan(
            id=orm_plan.id,
            user_id=orm_plan.user_id,
            title=orm_plan.title,
            description=orm_plan.description,
            target_date=orm_plan.target_date,
            status=PlanStatus(orm_plan.status),
            created_at=orm_plan.created_at,
            updated_at=orm_plan.updated_at,
        )
