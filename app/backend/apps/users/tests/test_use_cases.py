"""
ユーザーユースケースの単体テスト。
リポジトリはモックを使用し、ビジネスロジックのみをテストする。
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest

from apps.users.application.use_cases import RegisterUserCommand, RegisterUserUseCase
from apps.users.domain.models import User


def _make_user(**kwargs) -> User:
    """テスト用 User エンティティを生成する。"""
    defaults = {
        "id": uuid.uuid4(),
        "email": "test@example.com",
        "username": "テストユーザー",
        "is_active": True,
        "created_at": datetime.now(tz=timezone.utc),
    }
    return User(**{**defaults, **kwargs})


class TestRegisterUserUseCase:
    """RegisterUserUseCase のテスト。"""

    def test_正常登録(self):
        """メールアドレスが未登録の場合、ユーザーが作成されること。"""
        # Arrange
        repo = MagicMock()
        repo.find_by_email.return_value = None
        expected_user = _make_user()
        repo.create.return_value = expected_user

        use_case = RegisterUserUseCase(repo)
        command = RegisterUserCommand(
            email="test@example.com",
            username="テストユーザー",
            password="securepassword123",
        )

        # Act
        result = use_case.execute(command)

        # Assert
        assert result == expected_user
        repo.find_by_email.assert_called_once_with("test@example.com")
        repo.create.assert_called_once_with(
            email="test@example.com",
            username="テストユーザー",
            password="securepassword123",
        )

    def test_重複メールアドレスで例外(self):
        """既存のメールアドレスで登録しようとした場合、ValueError が発生すること。"""
        # Arrange
        repo = MagicMock()
        repo.find_by_email.return_value = _make_user()

        use_case = RegisterUserUseCase(repo)
        command = RegisterUserCommand(
            email="existing@example.com",
            username="別ユーザー",
            password="securepassword123",
        )

        # Act & Assert
        with pytest.raises(ValueError, match="既に登録されています"):
            use_case.execute(command)

        repo.create.assert_not_called()
