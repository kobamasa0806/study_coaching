"""
LINE Bot リポジトリの Django ORM 実装。
"""
from __future__ import annotations

import random
import string
from datetime import datetime, timezone
from uuid import UUID

from django.utils import timezone as django_timezone

from ..domain.models import (
    ConversationState,
    ConversationStateType,
    LinkCode,
    LineUserLink,
    StudyRecord,
)
from ..domain.repositories import (
    AbstractConversationStateRepository,
    AbstractLinkCodeRepository,
    AbstractLineUserLinkRepository,
    AbstractStudyRecordRepository,
)
from .models import (
    LinkCodeModel,
    LineConversationStateModel,
    LineUserLinkModel,
    StudyRecordModel,
)


class DjangoLineUserLinkRepository(AbstractLineUserLinkRepository):
    """Django ORM を使った LINE ユーザー紐付けリポジトリ実装。"""

    def find_by_line_user_id(self, line_user_id: str) -> LineUserLink | None:
        """LINE ユーザー ID から紐付け情報を検索する。"""
        try:
            orm = LineUserLinkModel.objects.get(line_user_id=line_user_id)
            return self._to_entity(orm)
        except LineUserLinkModel.DoesNotExist:
            return None

    def find_by_user_id(self, user_id: UUID) -> LineUserLink | None:
        """Django ユーザー ID から紐付け情報を検索する。"""
        try:
            orm = LineUserLinkModel.objects.get(user_id=user_id)
            return self._to_entity(orm)
        except LineUserLinkModel.DoesNotExist:
            return None

    def save(self, line_user_id: str, user_id: UUID) -> LineUserLink:
        """LINE アカウントと Django ユーザーを紐付けて保存する。"""
        orm, _ = LineUserLinkModel.objects.update_or_create(
            user_id=user_id,
            defaults={"line_user_id": line_user_id},
        )
        return self._to_entity(orm)

    def delete_by_line_user_id(self, line_user_id: str) -> None:
        """LINE ユーザー ID に紐付く情報を削除する。"""
        LineUserLinkModel.objects.filter(line_user_id=line_user_id).delete()

    def _to_entity(self, orm: LineUserLinkModel) -> LineUserLink:
        """ORM モデルをドメインエンティティに変換する。"""
        return LineUserLink(
            id=orm.id,
            user_id=orm.user_id,
            line_user_id=orm.line_user_id,
            created_at=orm.created_at,
        )


class DjangoConversationStateRepository(AbstractConversationStateRepository):
    """Django ORM を使った会話状態リポジトリ実装。"""

    def find_by_line_user_id(self, line_user_id: str) -> ConversationState | None:
        """LINE ユーザーの会話状態を取得する。"""
        try:
            orm = LineConversationStateModel.objects.get(line_user_id=line_user_id)
            return self._to_entity(orm)
        except LineConversationStateModel.DoesNotExist:
            return None

    def save(self, state: ConversationState) -> ConversationState:
        """会話状態を保存または更新する。"""
        orm, _ = LineConversationStateModel.objects.update_or_create(
            line_user_id=state.line_user_id,
            defaults={
                "state": state.state.value,
                "selected_plan_id": state.selected_plan_id,
                "selected_task_id": state.selected_task_id,
                "start_time": state.start_time,
                "study_date": state.study_date,
            },
        )
        return self._to_entity(orm)

    def delete(self, line_user_id: str) -> None:
        """会話状態を削除してリセットする。"""
        LineConversationStateModel.objects.filter(line_user_id=line_user_id).delete()

    def _to_entity(self, orm: LineConversationStateModel) -> ConversationState:
        """ORM モデルをドメインエンティティに変換する。"""
        return ConversationState(
            line_user_id=orm.line_user_id,
            state=ConversationStateType(orm.state),
            selected_plan_id=orm.selected_plan_id,
            selected_task_id=orm.selected_task_id,
            start_time=orm.start_time,
            study_date=orm.study_date,
            updated_at=orm.updated_at,
        )


class DjangoStudyRecordRepository(AbstractStudyRecordRepository):
    """Django ORM を使った学習記録リポジトリ実装。"""

    def save(self, record: StudyRecord) -> StudyRecord:
        """学習記録を保存する。"""
        orm = StudyRecordModel.objects.create(
            id=record.id,
            line_user_id=record.line_user_id,
            user_id=record.user_id,
            plan_id=record.plan_id,
            task_id=record.task_id,
            study_date=record.study_date,
            start_time=record.start_time,
            end_time=record.end_time,
            duration_minutes=record.duration_minutes,
            responded_at=record.responded_at,
        )
        return self._to_entity(orm)

    def list_by_user_id(self, user_id: UUID) -> list[StudyRecord]:
        """Django ユーザー ID に紐づく学習記録一覧を返す。"""
        orms = StudyRecordModel.objects.filter(user_id=user_id).select_related("plan", "task")
        return [self._to_entity(o) for o in orms]

    def list_by_line_user_id(self, line_user_id: str) -> list[StudyRecord]:
        """LINE ユーザー ID に紐づく学習記録一覧を返す。"""
        orms = StudyRecordModel.objects.filter(
            line_user_id=line_user_id
        ).select_related("plan", "task")
        return [self._to_entity(o) for o in orms]

    def _to_entity(self, orm: StudyRecordModel) -> StudyRecord:
        """ORM モデルをドメインエンティティに変換する。"""
        return StudyRecord(
            id=orm.id,
            line_user_id=orm.line_user_id,
            user_id=orm.user_id,
            plan_id=orm.plan_id,
            task_id=orm.task_id,
            study_date=orm.study_date,
            start_time=orm.start_time,
            end_time=orm.end_time,
            duration_minutes=orm.duration_minutes,
            responded_at=orm.responded_at,
            created_at=orm.created_at,
        )


class DjangoLinkCodeRepository(AbstractLinkCodeRepository):
    """Django ORM を使った紐付けコードリポジトリ実装。"""

    CODE_LENGTH = 6
    EXPIRE_MINUTES = 30

    def create(self, user_id: UUID) -> LinkCode:
        """新しい紐付けコードを生成して保存する。既存コードは上書きする。"""
        # 既存コードを削除
        LinkCodeModel.objects.filter(user_id=user_id).delete()

        code = self._generate_code()
        expires_at = django_timezone.now() + __import__("datetime").timedelta(
            minutes=self.EXPIRE_MINUTES
        )
        orm = LinkCodeModel.objects.create(
            code=code,
            user_id=user_id,
            expires_at=expires_at,
        )
        return self._to_entity(orm)

    def find_by_code(self, code: str) -> LinkCode | None:
        """コード文字列から紐付けコードを検索する。"""
        try:
            orm = LinkCodeModel.objects.get(code=code)
            return self._to_entity(orm)
        except LinkCodeModel.DoesNotExist:
            return None

    def delete(self, code: str) -> None:
        """紐付けコードを削除する。"""
        LinkCodeModel.objects.filter(code=code).delete()

    def _generate_code(self) -> str:
        """6桁の数字コードを生成する。"""
        return "".join(random.choices(string.digits, k=self.CODE_LENGTH))

    def _to_entity(self, orm: LinkCodeModel) -> LinkCode:
        """ORM モデルをドメインエンティティに変換する。"""
        return LinkCode(
            code=orm.code,
            user_id=orm.user_id,
            expires_at=orm.expires_at,
            created_at=orm.created_at,
        )
