"""
学習計画ユースケースの単体テスト。
リポジトリはモックを使用し、ビジネスロジックのみをテストする。
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from unittest.mock import MagicMock

import pytest

from apps.plans.application.use_cases import (
    CreateStudyPlanCommand,
    CreateStudyPlanUseCase,
    DeleteStudyPlanUseCase,
    GetStudyPlanUseCase,
    UpdateStudyPlanCommand,
    UpdateStudyPlanUseCase,
)
from apps.plans.domain.models import PlanStatus, StudyPlan


def _make_plan(**kwargs) -> StudyPlan:
    """テスト用 StudyPlan エンティティを生成する。"""
    now = datetime.now(tz=timezone.utc)
    defaults = {
        "id": uuid.uuid4(),
        "user_id": uuid.uuid4(),
        "title": "テスト計画",
        "description": "",
        "target_date": date(2026, 6, 30),
        "status": PlanStatus.ACTIVE,
        "created_at": now,
        "updated_at": now,
    }
    return StudyPlan(**{**defaults, **kwargs})


class TestCreateStudyPlanUseCase:
    """CreateStudyPlanUseCase のテスト。"""

    def test_正常作成(self):
        """正しいコマンドで学習計画が作成されること。"""
        repo = MagicMock()
        user_id = uuid.uuid4()
        expected = _make_plan(user_id=user_id)
        repo.create.return_value = expected

        use_case = CreateStudyPlanUseCase(repo)
        command = CreateStudyPlanCommand(
            user_id=user_id,
            title="テスト計画",
            description="",
            target_date=date(2026, 6, 30),
        )

        result = use_case.execute(command)

        assert result == expected
        repo.create.assert_called_once_with(
            user_id=user_id,
            title="テスト計画",
            description="",
            target_date=date(2026, 6, 30),
        )


class TestGetStudyPlanUseCase:
    """GetStudyPlanUseCase のテスト。"""

    def test_正常取得(self):
        """存在する計画を自分のIDで取得できること。"""
        repo = MagicMock()
        user_id = uuid.uuid4()
        plan = _make_plan(user_id=user_id)
        repo.find_by_id.return_value = plan

        use_case = GetStudyPlanUseCase(repo)
        result = use_case.execute(plan_id=plan.id, user_id=user_id)

        assert result == plan

    def test_存在しない計画でValueError(self):
        """存在しない計画IDを指定した場合、ValueError が発生すること。"""
        repo = MagicMock()
        repo.find_by_id.return_value = None

        use_case = GetStudyPlanUseCase(repo)

        with pytest.raises(ValueError, match="見つかりません"):
            use_case.execute(plan_id=uuid.uuid4(), user_id=uuid.uuid4())

    def test_他ユーザーの計画でPermissionError(self):
        """他ユーザーの計画にアクセスした場合、PermissionError が発生すること。"""
        repo = MagicMock()
        plan = _make_plan(user_id=uuid.uuid4())
        repo.find_by_id.return_value = plan

        use_case = GetStudyPlanUseCase(repo)

        with pytest.raises(PermissionError):
            use_case.execute(plan_id=plan.id, user_id=uuid.uuid4())


class TestUpdateStudyPlanUseCase:
    """UpdateStudyPlanUseCase のテスト。"""

    def test_正常更新(self):
        """所有者が計画を更新できること。"""
        repo = MagicMock()
        user_id = uuid.uuid4()
        plan = _make_plan(user_id=user_id)
        updated_plan = _make_plan(user_id=user_id, title="更新後タイトル")
        repo.find_by_id.return_value = plan
        repo.update.return_value = updated_plan

        use_case = UpdateStudyPlanUseCase(repo)
        command = UpdateStudyPlanCommand(
            plan_id=plan.id,
            user_id=user_id,
            title="更新後タイトル",
            description="",
            target_date=date(2026, 12, 31),
            status=PlanStatus.ACTIVE,
        )

        result = use_case.execute(command)

        assert result == updated_plan
        repo.update.assert_called_once()

    def test_他ユーザーの計画更新でPermissionError(self):
        """他ユーザーの計画を更新しようとした場合、PermissionError が発生すること。"""
        repo = MagicMock()
        plan = _make_plan(user_id=uuid.uuid4())
        repo.find_by_id.return_value = plan

        use_case = UpdateStudyPlanUseCase(repo)
        command = UpdateStudyPlanCommand(
            plan_id=plan.id,
            user_id=uuid.uuid4(),  # 別のユーザー
            title="悪意のある更新",
            description="",
            target_date=date(2026, 12, 31),
            status=PlanStatus.ACTIVE,
        )

        with pytest.raises(PermissionError):
            use_case.execute(command)
        repo.update.assert_not_called()


class TestDeleteStudyPlanUseCase:
    """DeleteStudyPlanUseCase のテスト。"""

    def test_正常削除(self):
        """所有者が計画を削除できること。"""
        repo = MagicMock()
        user_id = uuid.uuid4()
        plan = _make_plan(user_id=user_id)
        repo.find_by_id.return_value = plan

        use_case = DeleteStudyPlanUseCase(repo)
        use_case.execute(plan_id=plan.id, user_id=user_id)

        repo.delete.assert_called_once_with(plan.id)

    def test_他ユーザーの計画削除でPermissionError(self):
        """他ユーザーの計画を削除しようとした場合、PermissionError が発生すること。"""
        repo = MagicMock()
        plan = _make_plan(user_id=uuid.uuid4())
        repo.find_by_id.return_value = plan

        use_case = DeleteStudyPlanUseCase(repo)

        with pytest.raises(PermissionError):
            use_case.execute(plan_id=plan.id, user_id=uuid.uuid4())
        repo.delete.assert_not_called()
