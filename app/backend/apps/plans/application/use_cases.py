"""
学習計画関連のユースケース。
ビジネスロジックをここに集約する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from uuid import UUID

from ..domain.models import PlanStatus, StudyPlan
from ..domain.repositories import AbstractPlanRepository


@dataclass
class CreateStudyPlanCommand:
    """学習計画作成コマンド。"""

    user_id: UUID
    title: str
    description: str
    target_date: date


@dataclass
class UpdateStudyPlanCommand:
    """学習計画更新コマンド。"""

    plan_id: UUID
    user_id: UUID
    title: str
    description: str
    target_date: date
    status: PlanStatus


class CreateStudyPlanUseCase:
    """学習計画作成ユースケース。"""

    def __init__(self, plan_repository: AbstractPlanRepository) -> None:
        self._plan_repository = plan_repository

    def execute(self, command: CreateStudyPlanCommand) -> StudyPlan:
        """新規学習計画を作成する。"""
        return self._plan_repository.create(
            user_id=command.user_id,
            title=command.title,
            description=command.description,
            target_date=command.target_date,
        )


class ListStudyPlansUseCase:
    """学習計画一覧取得ユースケース。"""

    def __init__(self, plan_repository: AbstractPlanRepository) -> None:
        self._plan_repository = plan_repository

    def execute(self, user_id: UUID) -> list[StudyPlan]:
        """ユーザーの学習計画一覧を返す。"""
        return self._plan_repository.find_by_user_id(user_id)


class GetStudyPlanUseCase:
    """学習計画詳細取得ユースケース。"""

    def __init__(self, plan_repository: AbstractPlanRepository) -> None:
        self._plan_repository = plan_repository

    def execute(self, plan_id: UUID, user_id: UUID) -> StudyPlan:
        """
        指定した学習計画を返す。
        存在しない場合またはアクセス権限がない場合は ValueError を送出する。
        """
        plan = self._plan_repository.find_by_id(plan_id)
        if plan is None:
            raise ValueError("学習計画が見つかりません。")
        if plan.user_id != user_id:
            raise PermissionError("この学習計画へのアクセス権限がありません。")
        return plan


class UpdateStudyPlanUseCase:
    """学習計画更新ユースケース。"""

    def __init__(self, plan_repository: AbstractPlanRepository) -> None:
        self._plan_repository = plan_repository

    def execute(self, command: UpdateStudyPlanCommand) -> StudyPlan:
        """
        学習計画を更新する。
        存在しない場合またはアクセス権限がない場合は ValueError を送出する。
        """
        plan = self._plan_repository.find_by_id(command.plan_id)
        if plan is None:
            raise ValueError("学習計画が見つかりません。")
        if plan.user_id != command.user_id:
            raise PermissionError("この学習計画へのアクセス権限がありません。")

        return self._plan_repository.update(
            plan_id=command.plan_id,
            title=command.title,
            description=command.description,
            target_date=command.target_date,
            status=command.status,
        )


class DeleteStudyPlanUseCase:
    """学習計画削除ユースケース。"""

    def __init__(self, plan_repository: AbstractPlanRepository) -> None:
        self._plan_repository = plan_repository

    def execute(self, plan_id: UUID, user_id: UUID) -> None:
        """
        学習計画を削除する。
        存在しない場合またはアクセス権限がない場合は ValueError を送出する。
        """
        plan = self._plan_repository.find_by_id(plan_id)
        if plan is None:
            raise ValueError("学習計画が見つかりません。")
        if plan.user_id != user_id:
            raise PermissionError("この学習計画へのアクセス権限がありません。")

        self._plan_repository.delete(plan_id)
