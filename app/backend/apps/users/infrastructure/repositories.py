"""
ユーザーリポジトリの Django ORM 実装。
"""
from __future__ import annotations

from uuid import UUID

from ..domain.models import User as UserEntity
from ..domain.repositories import AbstractUserRepository
from .models import UserModel


class DjangoUserRepository(AbstractUserRepository):
    """Django ORM を使ったユーザーリポジトリ実装。"""

    def find_by_email(self, email: str) -> UserEntity | None:
        """メールアドレスでユーザーを検索する。"""
        try:
            orm_user = UserModel.objects.get(email=email)
            return self._to_entity(orm_user)
        except UserModel.DoesNotExist:
            return None

    def find_by_id(self, user_id: UUID) -> UserEntity | None:
        """ID でユーザーを検索する。"""
        try:
            orm_user = UserModel.objects.get(id=user_id)
            return self._to_entity(orm_user)
        except UserModel.DoesNotExist:
            return None

    def find_by_cognito_sub(self, cognito_sub: str) -> UserEntity | None:
        """Cognito sub でユーザーを検索する。"""
        try:
            orm_user = UserModel.objects.get(cognito_sub=cognito_sub)
            return self._to_entity(orm_user)
        except UserModel.DoesNotExist:
            return None

    def create(self, email: str, username: str, password: str, cognito_sub: str | None = None) -> UserEntity:
        """新規ユーザーを作成し、エンティティとして返す。"""
        orm_user = UserModel.objects.create_user(
            email=email,
            username=username,
            password=password,
            cognito_sub=cognito_sub,
        )
        return self._to_entity(orm_user)

    def _to_entity(self, orm_user: UserModel) -> UserEntity:
        """ORM モデルをドメインエンティティに変換する。"""
        return UserEntity(
            id=orm_user.id,
            email=orm_user.email,
            username=orm_user.username,
            is_active=orm_user.is_active,
            created_at=orm_user.created_at,
            cognito_sub=orm_user.cognito_sub,
        )
