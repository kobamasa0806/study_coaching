"""
ユーザーリポジトリの抽象インターフェース。
infrastructure 層で具体実装を行う。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from .models import User


class AbstractUserRepository(ABC):
    """ユーザーリポジトリの抽象基底クラス。"""

    @abstractmethod
    def find_by_email(self, email: str) -> User | None:
        """メールアドレスでユーザーを検索する。"""
        ...

    @abstractmethod
    def find_by_id(self, user_id: UUID) -> User | None:
        """ID でユーザーを検索する。"""
        ...

    @abstractmethod
    def find_by_cognito_sub(self, cognito_sub: str) -> User | None:
        """Cognito sub でユーザーを検索する。"""
        ...

    @abstractmethod
    def create(self, email: str, username: str, password: str, cognito_sub: str | None = None) -> User:
        """新規ユーザーを作成する（パスワードはハッシュ化して保存）。"""
        ...
