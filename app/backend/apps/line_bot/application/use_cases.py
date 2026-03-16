"""
LINE Bot アプリケーション層のユースケース。
LINE を介した学習記録の会話フローとアカウント紐付けのビジネスロジックを実装する。
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass
from datetime import date, datetime, time, timezone
from uuid import UUID

from django.utils import timezone as django_timezone

from ..domain.models import ConversationState, ConversationStateType, StudyRecord
from ..domain.repositories import (
    AbstractConversationStateRepository,
    AbstractLinkCodeRepository,
    AbstractLineUserLinkRepository,
    AbstractStudyRecordRepository,
)


# ---------------------------------------------------------------------------
# アカウント紐付けユースケース
# ---------------------------------------------------------------------------


@dataclass
class GenerateLinkCodeCommand:
    """LINE アカウント紐付けコード生成コマンド。"""

    user_id: UUID


@dataclass
class GenerateLinkCodeResult:
    """LINE アカウント紐付けコード生成結果。"""

    code: str
    expires_at: datetime


class GenerateLinkCodeUseCase:
    """LINE アカウント紐付けコードを生成するユースケース。"""

    def __init__(self, link_code_repository: AbstractLinkCodeRepository) -> None:
        self._link_code_repository = link_code_repository

    def execute(self, command: GenerateLinkCodeCommand) -> GenerateLinkCodeResult:
        """
        紐付けコードを生成して保存する。
        同じユーザーの既存コードは上書きされる。
        """
        link_code = self._link_code_repository.create(command.user_id)
        return GenerateLinkCodeResult(
            code=link_code.code,
            expires_at=link_code.expires_at,
        )


@dataclass
class HandleLinkCodeCommand:
    """LINE アカウント紐付けコード処理コマンド。"""

    line_user_id: str
    code: str


@dataclass
class HandleLinkCodeResult:
    """LINE アカウント紐付けコード処理結果。"""

    success: bool
    message: str


class HandleLinkCodeUseCase:
    """LINE から受け取った紐付けコードを処理するユースケース。"""

    def __init__(
        self,
        link_code_repository: AbstractLinkCodeRepository,
        line_user_link_repository: AbstractLineUserLinkRepository,
    ) -> None:
        self._link_code_repository = link_code_repository
        self._line_user_link_repository = line_user_link_repository

    def execute(self, command: HandleLinkCodeCommand) -> HandleLinkCodeResult:
        """
        コードを検証し、有効であれば LINE アカウントと Django ユーザーを紐付ける。
        有効期限切れや存在しないコードの場合はエラーメッセージを返す。
        """
        link_code = self._link_code_repository.find_by_code(command.code)
        if link_code is None:
            return HandleLinkCodeResult(
                success=False,
                message="紐付けコードが見つかりません。Webアプリで新しいコードを発行してください。",
            )

        if django_timezone.now() > link_code.expires_at:
            self._link_code_repository.delete(command.code)
            return HandleLinkCodeResult(
                success=False,
                message="紐付けコードの有効期限が切れています。Webアプリで新しいコードを発行してください。",
            )

        # 紐付けを保存してコードを削除する
        self._line_user_link_repository.save(
            line_user_id=command.line_user_id,
            user_id=link_code.user_id,
        )
        self._link_code_repository.delete(command.code)

        return HandleLinkCodeResult(
            success=True,
            message="LINEアカウントの紐付けが完了しました！\n学習記録の記録を開始できます。",
        )


# ---------------------------------------------------------------------------
# 会話フローユースケース
# ---------------------------------------------------------------------------


@dataclass
class StartRecordingResult:
    """学習記録フロー開始の結果。"""

    is_linked: bool
    plans: list[dict]  # [{"id": uuid_str, "title": str}]


class StartRecordingFlowUseCase:
    """
    学習記録フローを開始するユースケース。
    LINE アカウントが紐付けられているか確認し、計画一覧を返す。
    """

    def __init__(
        self,
        line_user_link_repository: AbstractLineUserLinkRepository,
        conversation_state_repository: AbstractConversationStateRepository,
    ) -> None:
        self._line_user_link_repository = line_user_link_repository
        self._conversation_state_repository = conversation_state_repository

    def execute(self, line_user_id: str) -> StartRecordingResult:
        """
        LINE ユーザーの紐付け状態を確認し、紐付け済みの場合は計画一覧を返す。
        計画一覧は infrastructure 層ではなく presentation 層で取得して渡す設計のため、
        ここではアカウント紐付けの確認と状態リセットのみを行う。
        """
        link = self._line_user_link_repository.find_by_line_user_id(line_user_id)
        if link is None:
            return StartRecordingResult(is_linked=False, plans=[])

        # 会話状態を SELECTING_PLAN にリセット
        state = ConversationState(
            line_user_id=line_user_id,
            state=ConversationStateType.SELECTING_PLAN,
            selected_plan_id=None,
            selected_task_id=None,
            start_time=None,
            study_date=date.today(),
            updated_at=django_timezone.now(),
        )
        self._conversation_state_repository.save(state)

        return StartRecordingResult(is_linked=True, plans=[])


@dataclass
class HandlePlanSelectionCommand:
    """学習計画選択コマンド。"""

    line_user_id: str
    plan_id: UUID


class HandlePlanSelectionUseCase:
    """選択された学習計画を状態に保存するユースケース。"""

    def __init__(
        self,
        conversation_state_repository: AbstractConversationStateRepository,
    ) -> None:
        self._conversation_state_repository = conversation_state_repository

    def execute(self, command: HandlePlanSelectionCommand) -> ConversationState:
        """
        学習計画 ID を会話状態に保存し、SELECTING_TASK 状態に遷移する。
        """
        current_state = self._conversation_state_repository.find_by_line_user_id(
            command.line_user_id
        )
        if current_state is None or current_state.state != ConversationStateType.SELECTING_PLAN:
            raise ValueError("無効な操作です。「学習記録」と入力してやり直してください。")

        new_state = ConversationState(
            line_user_id=command.line_user_id,
            state=ConversationStateType.SELECTING_TASK,
            selected_plan_id=command.plan_id,
            selected_task_id=None,
            start_time=None,
            study_date=current_state.study_date,
            updated_at=django_timezone.now(),
        )
        return self._conversation_state_repository.save(new_state)


@dataclass
class HandleTaskSelectionCommand:
    """タスク選択コマンド。"""

    line_user_id: str
    task_id: UUID


class HandleTaskSelectionUseCase:
    """選択されたタスクを状態に保存するユースケース。"""

    def __init__(
        self,
        conversation_state_repository: AbstractConversationStateRepository,
    ) -> None:
        self._conversation_state_repository = conversation_state_repository

    def execute(self, command: HandleTaskSelectionCommand) -> ConversationState:
        """
        タスク ID を会話状態に保存し、ENTERING_START_TIME 状態に遷移する。
        """
        current_state = self._conversation_state_repository.find_by_line_user_id(
            command.line_user_id
        )
        if current_state is None or current_state.state != ConversationStateType.SELECTING_TASK:
            raise ValueError("無効な操作です。「学習記録」と入力してやり直してください。")

        new_state = ConversationState(
            line_user_id=command.line_user_id,
            state=ConversationStateType.ENTERING_START_TIME,
            selected_plan_id=current_state.selected_plan_id,
            selected_task_id=command.task_id,
            start_time=None,
            study_date=current_state.study_date,
            updated_at=django_timezone.now(),
        )
        return self._conversation_state_repository.save(new_state)


@dataclass
class HandleStartTimeCommand:
    """開始時刻入力コマンド。"""

    line_user_id: str
    # "HH:MM" 形式
    start_time: str


class HandleStartTimeUseCase:
    """開始時刻を状態に保存するユースケース。"""

    def __init__(
        self,
        conversation_state_repository: AbstractConversationStateRepository,
    ) -> None:
        self._conversation_state_repository = conversation_state_repository

    def execute(self, command: HandleStartTimeCommand) -> ConversationState:
        """
        開始時刻を会話状態に保存し、ENTERING_END_TIME 状態に遷移する。
        """
        current_state = self._conversation_state_repository.find_by_line_user_id(
            command.line_user_id
        )
        if (
            current_state is None
            or current_state.state != ConversationStateType.ENTERING_START_TIME
        ):
            raise ValueError("無効な操作です。「学習記録」と入力してやり直してください。")

        new_state = ConversationState(
            line_user_id=command.line_user_id,
            state=ConversationStateType.ENTERING_END_TIME,
            selected_plan_id=current_state.selected_plan_id,
            selected_task_id=current_state.selected_task_id,
            start_time=command.start_time,
            study_date=current_state.study_date,
            updated_at=django_timezone.now(),
        )
        return self._conversation_state_repository.save(new_state)


@dataclass
class HandleEndTimeCommand:
    """終了時刻入力コマンド。"""

    line_user_id: str
    # "HH:MM" 形式
    end_time: str
    # Webhook 受信日時
    responded_at: datetime


@dataclass
class HandleEndTimeResult:
    """終了時刻処理・学習記録保存の結果。"""

    study_record: StudyRecord
    plan_title: str
    task_title: str


class HandleEndTimeAndSaveUseCase:
    """
    終了時刻を受け取り、学習時間を計算して学習記録を保存するユースケース。
    """

    def __init__(
        self,
        conversation_state_repository: AbstractConversationStateRepository,
        study_record_repository: AbstractStudyRecordRepository,
        line_user_link_repository: AbstractLineUserLinkRepository,
    ) -> None:
        self._conversation_state_repository = conversation_state_repository
        self._study_record_repository = study_record_repository
        self._line_user_link_repository = line_user_link_repository

    def execute(
        self,
        command: HandleEndTimeCommand,
        plan_title: str,
        task_title: str,
    ) -> HandleEndTimeResult:
        """
        終了時刻から学習時間を計算し、学習記録を保存する。
        保存後は会話状態を削除して IDLE に戻す。
        """
        current_state = self._conversation_state_repository.find_by_line_user_id(
            command.line_user_id
        )
        if (
            current_state is None
            or current_state.state != ConversationStateType.ENTERING_END_TIME
        ):
            raise ValueError("無効な操作です。「学習記録」と入力してやり直してください。")

        start_time = _parse_time(current_state.start_time)
        end_time = _parse_time(command.end_time)
        duration_minutes = _calculate_duration(start_time, end_time)

        # LINE アカウントに紐付けられた Django ユーザー ID を取得する
        link = self._line_user_link_repository.find_by_line_user_id(command.line_user_id)
        user_id = link.user_id if link is not None else None

        study_date = current_state.study_date or date.today()

        record = StudyRecord(
            id=uuid.uuid4(),
            line_user_id=command.line_user_id,
            user_id=user_id,
            plan_id=current_state.selected_plan_id,
            task_id=current_state.selected_task_id,
            study_date=study_date,
            start_time=start_time,
            end_time=end_time,
            duration_minutes=duration_minutes,
            responded_at=command.responded_at,
            created_at=command.responded_at,
        )
        saved_record = self._study_record_repository.save(record)

        # 会話状態を削除して IDLE に戻す
        self._conversation_state_repository.delete(command.line_user_id)

        return HandleEndTimeResult(
            study_record=saved_record,
            plan_title=plan_title,
            task_title=task_title,
        )


# ---------------------------------------------------------------------------
# 学習記録参照ユースケース
# ---------------------------------------------------------------------------


@dataclass
class ListStudyRecordsCommand:
    """学習記録一覧取得コマンド。"""

    user_id: UUID


class ListStudyRecordsUseCase:
    """ログイン中ユーザーの学習記録一覧を取得するユースケース。"""

    def __init__(
        self,
        study_record_repository: AbstractStudyRecordRepository,
    ) -> None:
        self._study_record_repository = study_record_repository

    def execute(self, command: ListStudyRecordsCommand) -> list[StudyRecord]:
        """ユーザーの学習記録を新しい順で返す。"""
        return self._study_record_repository.list_by_user_id(command.user_id)


# ---------------------------------------------------------------------------
# ヘルパー関数
# ---------------------------------------------------------------------------


def _parse_time(time_str: str | None) -> time:
    """
    "HH:MM" 形式の文字列を time オブジェクトに変換する。
    """
    if time_str is None:
        raise ValueError("時刻が設定されていません。")
    hour, minute = map(int, time_str.split(":"))
    return time(hour=hour, minute=minute)


def _calculate_duration(start: time, end: time) -> int:
    """
    開始時刻と終了時刻から学習時間（分）を計算する。
    日跨ぎ（終了が翌日）にも対応する。
    """
    start_minutes = start.hour * 60 + start.minute
    end_minutes = end.hour * 60 + end.minute
    if end_minutes < start_minutes:
        # 日跨ぎの場合は翌日として計算する
        end_minutes += 24 * 60
    return end_minutes - start_minutes
