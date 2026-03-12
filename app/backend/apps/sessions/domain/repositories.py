"""
セッションリポジトリの抽象インターフェース。
infrastructure 層で具体実装を行う。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime
from uuid import UUID

from .models import Session, SessionStatus


class AbstractSessionRepository(ABC):
    """セッションリポジトリの抽象基底クラス。"""

    @abstractmethod
    def find_by_id(self, session_id: UUID) -> Session | None:
        """ID でセッションを検索する。"""
        ...

    @abstractmethod
    def find_by_user_id(self, user_id: UUID) -> list[Session]:
        """ユーザーIDに紐づくセッション一覧を返す（予定日時降順）。"""
        ...

    @abstractmethod
    def create(
        self,
        user_id: UUID,
        scheduled_at: datetime,
        memo: str,
    ) -> Session:
        """新規セッションを作成する。"""
        ...

    @abstractmethod
    def update(
        self,
        session_id: UUID,
        scheduled_at: datetime,
        memo: str,
        summary: str,
        status: SessionStatus,
    ) -> Session:
        """セッションを更新する。"""
        ...

    @abstractmethod
    def delete(self, session_id: UUID) -> None:
        """セッションを削除する。"""
        ...
