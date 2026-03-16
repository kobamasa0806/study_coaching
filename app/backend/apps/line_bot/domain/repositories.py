"""
LINE Bot リポジトリインターフェース。
infrastructure 層で実装する抽象クラスを定義する。
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from uuid import UUID

from .models import ConversationState, LinkCode, LineUserLink, StudyRecord


class AbstractLineUserLinkRepository(ABC):
    """LINE ユーザー紐付けリポジトリのインターフェース。"""

    @abstractmethod
    def find_by_line_user_id(self, line_user_id: str) -> LineUserLink | None:
        """LINE ユーザー ID から紐付け情報を検索する。"""
        ...

    @abstractmethod
    def find_by_user_id(self, user_id: UUID) -> LineUserLink | None:
        """Django ユーザー ID から紐付け情報を検索する。"""
        ...

    @abstractmethod
    def save(self, line_user_id: str, user_id: UUID) -> LineUserLink:
        """LINE アカウントと Django ユーザーを紐付けて保存する。"""
        ...

    @abstractmethod
    def delete_by_line_user_id(self, line_user_id: str) -> None:
        """LINE ユーザー ID に紐付く情報を削除する。"""
        ...


class AbstractConversationStateRepository(ABC):
    """会話状態リポジトリのインターフェース。"""

    @abstractmethod
    def find_by_line_user_id(self, line_user_id: str) -> ConversationState | None:
        """LINE ユーザーの会話状態を取得する。"""
        ...

    @abstractmethod
    def save(self, state: ConversationState) -> ConversationState:
        """会話状態を保存または更新する。"""
        ...

    @abstractmethod
    def delete(self, line_user_id: str) -> None:
        """会話状態を削除してリセットする。"""
        ...


class AbstractStudyRecordRepository(ABC):
    """学習記録リポジトリのインターフェース。"""

    @abstractmethod
    def save(self, record: StudyRecord) -> StudyRecord:
        """学習記録を保存する。"""
        ...

    @abstractmethod
    def list_by_user_id(self, user_id: UUID) -> list[StudyRecord]:
        """Django ユーザー ID に紐づく学習記録一覧を返す。"""
        ...

    @abstractmethod
    def list_by_line_user_id(self, line_user_id: str) -> list[StudyRecord]:
        """LINE ユーザー ID に紐づく学習記録一覧を返す。"""
        ...


class AbstractLinkCodeRepository(ABC):
    """紐付けコードリポジトリのインターフェース。"""

    @abstractmethod
    def create(self, user_id: UUID) -> LinkCode:
        """新しい紐付けコードを生成して保存する。"""
        ...

    @abstractmethod
    def find_by_code(self, code: str) -> LinkCode | None:
        """コード文字列から紐付けコードを検索する。"""
        ...

    @abstractmethod
    def delete(self, code: str) -> None:
        """紐付けコードを削除する。"""
        ...
