"""
セッションリポジトリの Django ORM 実装。
"""
from __future__ import annotations

from datetime import datetime
from uuid import UUID

from ..domain.models import Session, SessionStatus
from ..domain.repositories import AbstractSessionRepository
from .models import SessionModel


class DjangoSessionRepository(AbstractSessionRepository):
    """Django ORM を使ったセッションリポジトリ実装。"""

    def find_by_id(self, session_id: UUID) -> Session | None:
        """ID でセッションを検索する。"""
        try:
            orm_session = SessionModel.objects.get(id=session_id)
            return self._to_entity(orm_session)
        except SessionModel.DoesNotExist:
            return None

    def find_by_user_id(self, user_id: UUID) -> list[Session]:
        """ユーザーIDに紐づくセッション一覧を予定日時降順で返す。"""
        orm_sessions = SessionModel.objects.filter(user_id=user_id)
        return [self._to_entity(s) for s in orm_sessions]

    def create(
        self,
        user_id: UUID,
        scheduled_at: datetime,
        memo: str,
    ) -> Session:
        """新規セッションを作成する。"""
        orm_session = SessionModel.objects.create(
            user_id=user_id,
            scheduled_at=scheduled_at,
            memo=memo,
        )
        return self._to_entity(orm_session)

    def update(
        self,
        session_id: UUID,
        scheduled_at: datetime,
        memo: str,
        summary: str,
        status: SessionStatus,
    ) -> Session:
        """セッションを更新する。"""
        SessionModel.objects.filter(id=session_id).update(
            scheduled_at=scheduled_at,
            memo=memo,
            summary=summary,
            status=status.value,
        )
        orm_session = SessionModel.objects.get(id=session_id)
        return self._to_entity(orm_session)

    def delete(self, session_id: UUID) -> None:
        """セッションを削除する。"""
        SessionModel.objects.filter(id=session_id).delete()

    def _to_entity(self, orm_session: SessionModel) -> Session:
        """ORM モデルをドメインエンティティに変換する。"""
        return Session(
            id=orm_session.id,
            user_id=orm_session.user_id,
            scheduled_at=orm_session.scheduled_at,
            memo=orm_session.memo,
            summary=orm_session.summary,
            status=SessionStatus(orm_session.status),
            created_at=orm_session.created_at,
            updated_at=orm_session.updated_at,
        )
