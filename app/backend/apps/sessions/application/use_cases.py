"""
セッション関連のユースケース。
ビジネスロジックをここに集約する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from ..domain.models import Session, SessionStatus
from ..domain.repositories import AbstractSessionRepository


@dataclass
class CreateSessionCommand:
    """セッション作成コマンド。"""

    user_id: UUID
    scheduled_at: datetime
    memo: str


@dataclass
class UpdateSessionCommand:
    """セッション更新コマンド。"""

    session_id: UUID
    user_id: UUID
    scheduled_at: datetime
    memo: str
    summary: str
    status: SessionStatus


class CreateSessionUseCase:
    """セッション作成ユースケース。"""

    def __init__(self, session_repository: AbstractSessionRepository) -> None:
        self._session_repository = session_repository

    def execute(self, command: CreateSessionCommand) -> Session:
        """新規セッションを作成する。"""
        return self._session_repository.create(
            user_id=command.user_id,
            scheduled_at=command.scheduled_at,
            memo=command.memo,
        )


class ListSessionsUseCase:
    """セッション一覧取得ユースケース。"""

    def __init__(self, session_repository: AbstractSessionRepository) -> None:
        self._session_repository = session_repository

    def execute(self, user_id: UUID) -> list[Session]:
        """ユーザーのセッション一覧を予定日時降順で返す。"""
        return self._session_repository.find_by_user_id(user_id)


class GetSessionUseCase:
    """セッション詳細取得ユースケース。"""

    def __init__(self, session_repository: AbstractSessionRepository) -> None:
        self._session_repository = session_repository

    def execute(self, session_id: UUID, user_id: UUID) -> Session:
        """
        指定したセッションを返す。
        存在しない場合またはアクセス権限がない場合は例外を送出する。
        """
        session = self._session_repository.find_by_id(session_id)
        if session is None:
            raise ValueError("セッションが見つかりません。")
        if session.user_id != user_id:
            raise PermissionError("このセッションへのアクセス権限がありません。")
        return session


class UpdateSessionUseCase:
    """セッション更新ユースケース。"""

    def __init__(self, session_repository: AbstractSessionRepository) -> None:
        self._session_repository = session_repository

    def execute(self, command: UpdateSessionCommand) -> Session:
        """
        セッションを更新する。
        完了済みセッションへの予定日時変更は不可。
        """
        session = self._session_repository.find_by_id(command.session_id)
        if session is None:
            raise ValueError("セッションが見つかりません。")
        if session.user_id != command.user_id:
            raise PermissionError("このセッションへのアクセス権限がありません。")
        if (
            session.status == SessionStatus.COMPLETED
            and command.scheduled_at != session.scheduled_at
        ):
            raise ValueError("完了済みセッションの予定日時は変更できません。")

        return self._session_repository.update(
            session_id=command.session_id,
            scheduled_at=command.scheduled_at,
            memo=command.memo,
            summary=command.summary,
            status=command.status,
        )


class DeleteSessionUseCase:
    """セッション削除ユースケース。"""

    def __init__(self, session_repository: AbstractSessionRepository) -> None:
        self._session_repository = session_repository

    def execute(self, session_id: UUID, user_id: UUID) -> None:
        """
        セッションを削除する。
        完了済みセッションは削除不可。
        """
        session = self._session_repository.find_by_id(session_id)
        if session is None:
            raise ValueError("セッションが見つかりません。")
        if session.user_id != user_id:
            raise PermissionError("このセッションへのアクセス権限がありません。")
        if session.status == SessionStatus.COMPLETED:
            raise ValueError("完了済みセッションは削除できません。")

        self._session_repository.delete(session_id)
