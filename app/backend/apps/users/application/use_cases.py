"""
ユーザー関連のユースケース。
ビジネスロジックをここに集約する。
"""
from __future__ import annotations

from dataclasses import dataclass

from ..domain.cognito_service import AbstractCognitoService
from ..domain.models import User
from ..domain.repositories import AbstractUserRepository


@dataclass
class RegisterUserCommand:
    """ユーザー登録コマンド。"""

    email: str
    username: str
    password: str


class RegisterUserUseCase:
    """ユーザー登録ユースケース。Cognito と ローカル DB の両方にユーザーを作成する。"""

    def __init__(
        self,
        user_repository: AbstractUserRepository,
        cognito_service: AbstractCognitoService,
    ) -> None:
        self._user_repository = user_repository
        self._cognito_service = cognito_service

    def execute(self, command: RegisterUserCommand) -> User:
        """
        新規ユーザーを Cognito とローカル DB に登録する。
        同一メールアドレスが既に存在する場合は ValueError を送出する。
        Cognito への登録後にローカル DB 登録が失敗した場合は Cognito のユーザーをロールバックする。
        """
        # ローカル DB に同一メールアドレスが存在するか確認する
        existing = self._user_repository.find_by_email(command.email)
        if existing is not None:
            raise ValueError("このメールアドレスは既に登録されています。")

        # Cognito にユーザーを作成し、sub（Cognito ユーザー ID）を取得する
        cognito_sub = self._cognito_service.create_user(
            email=command.email,
            password=command.password,
            username=command.username,
        )

        # ローカル DB にユーザーを作成する（失敗時は Cognito をロールバックする）
        try:
            return self._user_repository.create(
                email=command.email,
                username=command.username,
                password=command.password,
                cognito_sub=cognito_sub,
            )
        except Exception:
            self._cognito_service.delete_user(command.email)
            raise
