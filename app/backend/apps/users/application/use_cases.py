"""
ユーザー関連のユースケース。
ビジネスロジックをここに集約する。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass

from ..domain.models import User
from ..domain.repositories import AbstractUserRepository


@dataclass
class RegisterUserCommand:
    """ユーザー登録コマンド。"""

    email: str
    username: str
    password: str


class AbstractCognitoAdminService(ABC):
    """Cognito 管理操作のポートインターフェース。infrastructure 層で実装する。"""

    @abstractmethod
    def create_coach(self, email: str) -> None: ...


@dataclass
class CreateCoachCommand:
    """コーチ作成コマンド。"""

    email: str


class CreateCoachUseCase:
    """コーチアカウント作成ユースケース。"""

    def __init__(self, cognito_admin_service: AbstractCognitoAdminService) -> None:
        self._cognito_admin_service = cognito_admin_service

    def execute(self, command: CreateCoachCommand) -> None:
        """コーチアカウントを Cognito に作成する。"""
        self._cognito_admin_service.create_coach(email=command.email)


class RegisterUserUseCase:
    """ユーザー登録ユースケース。"""

    def __init__(self, user_repository: AbstractUserRepository) -> None:
        self._user_repository = user_repository

    def execute(self, command: RegisterUserCommand) -> User:
        """
        新規ユーザーを登録する。
        同一メールアドレスが既に存在する場合は ValueError を送出する。
        """
        existing = self._user_repository.find_by_email(command.email)
        if existing is not None:
            raise ValueError("このメールアドレスは既に登録されています。")

        return self._user_repository.create(
            email=command.email,
            username=command.username,
            password=command.password,
        )
