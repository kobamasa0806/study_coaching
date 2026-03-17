"""
LINE Bot および学習記録 API のビュー。
- LineWebhookView: LINE プラットフォームからの Webhook を受け取る
- GenerateLinkCodeView: Web ユーザー向けの LINE 紐付けコード発行 API
- StudyRecordListView: 学習記録一覧 API
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from django.conf import settings
from linebot.v3 import WebhookParser
from linebot.v3.exceptions import InvalidSignatureError
from linebot.v3.messaging import (
    ApiClient,
    Configuration,
    MessagingApi,
    ReplyMessageRequest,
)
from linebot.v3.webhooks import (
    MessageEvent,
    PostbackEvent,
    TextMessageContent,
)
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.plans.infrastructure.models import PlanModel
from apps.plans.infrastructure.repositories import DjangoPlanRepository
from apps.tasks.infrastructure.models import TaskModel
from apps.tasks.infrastructure.repositories import DjangoTaskRepository

from ..application.use_cases import (
    GenerateLinkCodeCommand,
    GenerateLinkCodeUseCase,
    HandleEndTimeAndSaveUseCase,
    HandleEndTimeCommand,
    HandleLinkCodeCommand,
    HandleLinkCodeUseCase,
    HandlePlanSelectionCommand,
    HandlePlanSelectionUseCase,
    HandleStartTimeCommand,
    HandleStartTimeUseCase,
    HandleTaskSelectionCommand,
    HandleTaskSelectionUseCase,
    ListStudyRecordsCommand,
    ListStudyRecordsUseCase,
    StartRecordingFlowUseCase,
)
from ..domain.models import ConversationStateType
from ..infrastructure.repositories import (
    DjangoConversationStateRepository,
    DjangoLinkCodeRepository,
    DjangoLineUserLinkRepository,
    DjangoStudyRecordRepository,
)
from . import line_messages
from .serializers import GenerateLinkCodeResponseSerializer, StudyRecordResponseSerializer

logger = logging.getLogger(__name__)

# LINE メッセージング API クライアントの設定
_line_configuration = None


def _get_line_configuration() -> Configuration:
    """LINE API クライアント設定をシングルトンで返す。"""
    global _line_configuration
    if _line_configuration is None:
        _line_configuration = Configuration(
            access_token=settings.LINE_CHANNEL_ACCESS_TOKEN
        )
    return _line_configuration


def _reply(reply_token: str, message: object) -> None:
    """LINE にリプライメッセージを送信する。"""
    with ApiClient(_get_line_configuration()) as api_client:
        line_bot_api = MessagingApi(api_client)
        line_bot_api.reply_message(
            ReplyMessageRequest(
                reply_token=reply_token,
                messages=[message],
            )
        )


class LineWebhookView(APIView):
    """
    LINE プラットフォームからの Webhook を受け取るビュー。
    署名検証後、イベントの種類に応じた会話フローを処理する。
    """

    # LINE からのリクエストなので JWT 認証は不要
    permission_classes = [AllowAny]
    # CSRF 検証を除外する（LINE Webhook は CSRF トークンを送らない）
    authentication_classes = []

    def post(self, request: Request) -> Response:
        """LINE Webhook イベントを処理する。"""
        signature = request.META.get("HTTP_X_LINE_SIGNATURE", "")
        body = request.body.decode("utf-8")

        try:
            parser = WebhookParser(settings.LINE_CHANNEL_SECRET)
            events = parser.parse(body, signature)
        except InvalidSignatureError:
            logger.warning("LINE Webhook: 署名検証に失敗しました。")
            return Response(
                {"error": "署名が無効です。"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            logger.exception("LINE Webhook: リクエストの解析に失敗しました。%s", e)
            return Response(
                {"error": "リクエストの解析に失敗しました。"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        for event in events:
            try:
                if isinstance(event, PostbackEvent):
                    self._handle_postback(event)
                elif isinstance(event, MessageEvent) and isinstance(
                    event.message, TextMessageContent
                ):
                    self._handle_text_message(event)
            except Exception as e:
                logger.exception(
                    "LINE Webhook: イベント処理中にエラーが発生しました。line_user_id=%s, error=%s",
                    event.source.user_id,
                    e,
                )

        return Response({"status": "ok"})

    # ------------------------------------------------------------------
    # テキストメッセージの処理
    # ------------------------------------------------------------------

    def _handle_text_message(self, event: MessageEvent) -> None:
        """テキストメッセージを処理する。"""
        line_user_id = event.source.user_id
        text = event.message.text.strip()

        # 6桁の数字のみ → アカウント紐付けコードとして処理
        if text.isdigit() and len(text) == 6:
            self._process_link_code(line_user_id, text, event.reply_token)
            return

        if text in ("学習記録", "きろく", "記録"):
            self._process_start_recording(line_user_id, event.reply_token)
            return

        if text in ("ヘルプ", "help", "使い方"):
            _reply(event.reply_token, line_messages.build_help_message())
            return

        # その他のテキストはヘルプを案内する
        _reply(event.reply_token, line_messages.build_help_message())

    def _process_link_code(
        self, line_user_id: str, code: str, reply_token: str
    ) -> None:
        """紐付けコードを処理してアカウントを連携する。"""
        use_case = HandleLinkCodeUseCase(
            link_code_repository=DjangoLinkCodeRepository(),
            line_user_link_repository=DjangoLineUserLinkRepository(),
        )
        result = use_case.execute(HandleLinkCodeCommand(line_user_id=line_user_id, code=code))
        from linebot.v3.messaging import TextMessage as LINETextMessage
        _reply(
            reply_token,
            line_messages.build_error_message(result.message)
            if not result.success
            else LINETextMessage(text=result.message),
        )

    def _process_start_recording(self, line_user_id: str, reply_token: str) -> None:
        """学習記録フローを開始する。"""
        use_case = StartRecordingFlowUseCase(
            line_user_link_repository=DjangoLineUserLinkRepository(),
            conversation_state_repository=DjangoConversationStateRepository(),
        )
        result = use_case.execute(line_user_id)

        if not result.is_linked:
            _reply(reply_token, line_messages.build_not_linked_message())
            return

        # 紐付け済みユーザーの学習計画を取得する
        link = DjangoLineUserLinkRepository().find_by_line_user_id(line_user_id)
        plans = PlanModel.objects.filter(user_id=link.user_id, status="active").values(
            "id", "title"
        )
        plan_list = [{"id": str(p["id"]), "title": p["title"]} for p in plans]

        if not plan_list:
            # アーカイブ以外の全計画を取得する
            plans = PlanModel.objects.filter(user_id=link.user_id).exclude(
                status="archived"
            ).values("id", "title")
            plan_list = [{"id": str(p["id"]), "title": p["title"]} for p in plans]

        _reply(reply_token, line_messages.build_plan_selection_message(plan_list))

    # ------------------------------------------------------------------
    # ポストバックイベントの処理
    # ------------------------------------------------------------------

    def _handle_postback(self, event: PostbackEvent) -> None:
        """ポストバックイベントをアクションに応じてルーティングする。"""
        line_user_id = event.source.user_id
        data = event.postback.data
        params = event.postback.params

        if data == "action=start_recording":
            self._process_start_recording(line_user_id, event.reply_token)
            return

        if data.startswith("action=select_plan"):
            plan_id = self._parse_param(data, "plan_id")
            if plan_id:
                self._process_plan_selection(line_user_id, plan_id, event.reply_token)
            return

        if data.startswith("action=select_task"):
            task_id = self._parse_param(data, "task_id")
            if task_id:
                self._process_task_selection(line_user_id, task_id, event.reply_token)
            return

        if data == "action=set_start_time":
            # DatetimePicker の選択値は params["time"] に入る
            time_value = params.get("time") if params else None
            if time_value:
                self._process_start_time(line_user_id, time_value, event.reply_token)
            return

        if data == "action=set_end_time":
            time_value = params.get("time") if params else None
            if time_value:
                self._process_end_time(
                    line_user_id,
                    time_value,
                    event.reply_token,
                    responded_at=datetime.now(timezone.utc),
                )
            return

    def _parse_param(self, data: str, key: str) -> str | None:
        """クエリ文字列形式のポストバックデータからパラメータを取得する。"""
        for part in data.split("&"):
            if "=" in part:
                k, v = part.split("=", 1)
                if k == key:
                    return v
        return None

    def _process_plan_selection(
        self, line_user_id: str, plan_id: str, reply_token: str
    ) -> None:
        """学習計画選択を処理してタスク一覧を返す。"""
        try:
            use_case = HandlePlanSelectionUseCase(
                conversation_state_repository=DjangoConversationStateRepository(),
            )
            use_case.execute(
                HandlePlanSelectionCommand(
                    line_user_id=line_user_id,
                    plan_id=__import__("uuid").UUID(plan_id),
                )
            )
        except ValueError as e:
            _reply(reply_token, line_messages.build_error_message(str(e)))
            return

        # 選択された計画のタスク一覧を取得する
        tasks = TaskModel.objects.filter(plan_id=plan_id).values("id", "title").order_by("order")
        task_list = [{"id": str(t["id"]), "title": t["title"]} for t in tasks]
        _reply(reply_token, line_messages.build_task_selection_message(task_list))

    def _process_task_selection(
        self, line_user_id: str, task_id: str, reply_token: str
    ) -> None:
        """タスク選択を処理して開始時刻入力を促す。"""
        try:
            use_case = HandleTaskSelectionUseCase(
                conversation_state_repository=DjangoConversationStateRepository(),
            )
            use_case.execute(
                HandleTaskSelectionCommand(
                    line_user_id=line_user_id,
                    task_id=__import__("uuid").UUID(task_id),
                )
            )
        except ValueError as e:
            _reply(reply_token, line_messages.build_error_message(str(e)))
            return

        _reply(reply_token, line_messages.build_start_time_picker_message())

    def _process_start_time(
        self, line_user_id: str, start_time: str, reply_token: str
    ) -> None:
        """開始時刻を保存して終了時刻入力を促す。"""
        try:
            use_case = HandleStartTimeUseCase(
                conversation_state_repository=DjangoConversationStateRepository(),
            )
            use_case.execute(
                HandleStartTimeCommand(
                    line_user_id=line_user_id,
                    start_time=start_time,
                )
            )
        except ValueError as e:
            _reply(reply_token, line_messages.build_error_message(str(e)))
            return

        _reply(reply_token, line_messages.build_end_time_picker_message(start_time))

    def _process_end_time(
        self,
        line_user_id: str,
        end_time: str,
        reply_token: str,
        responded_at: datetime,
    ) -> None:
        """終了時刻を処理して学習記録を保存する。"""
        # 会話状態から計画・タスク情報を取得して名称を付与する
        state_repo = DjangoConversationStateRepository()
        current_state = state_repo.find_by_line_user_id(line_user_id)
        if current_state is None:
            _reply(reply_token, line_messages.build_error_message(
                "セッションがタイムアウトしました。「学習記録」と入力してやり直してください。"
            ))
            return

        # 計画・タスクのタイトルを取得する
        plan_title = ""
        task_title = ""
        try:
            plan = PlanModel.objects.get(id=current_state.selected_plan_id)
            plan_title = plan.title
            task = TaskModel.objects.get(id=current_state.selected_task_id)
            task_title = task.title
        except Exception:
            plan_title = "（不明）"
            task_title = "（不明）"

        try:
            use_case = HandleEndTimeAndSaveUseCase(
                conversation_state_repository=state_repo,
                study_record_repository=DjangoStudyRecordRepository(),
                line_user_link_repository=DjangoLineUserLinkRepository(),
                task_repository=DjangoTaskRepository(),
            )
            result = use_case.execute(
                HandleEndTimeCommand(
                    line_user_id=line_user_id,
                    end_time=end_time,
                    responded_at=responded_at,
                ),
                plan_title=plan_title,
                task_title=task_title,
            )
        except ValueError as e:
            _reply(reply_token, line_messages.build_error_message(str(e)))
            return

        record = result.study_record
        _reply(
            reply_token,
            line_messages.build_record_saved_message(
                plan_title=result.plan_title,
                task_title=result.task_title,
                study_date=str(record.study_date),
                start_time=record.start_time.strftime("%H:%M"),
                end_time=record.end_time.strftime("%H:%M"),
                duration_minutes=record.duration_minutes,
            ),
        )


# ---------------------------------------------------------------------------
# LINE 紐付けコード発行 API
# ---------------------------------------------------------------------------


class GenerateLinkCodeView(APIView):
    """
    ログイン中ユーザー向けの LINE 紐付けコード発行 API。
    返却されたコードを LINE Bot に送信するとアカウントが連携される。
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """LINE 紐付けコードを発行する。"""
        use_case = GenerateLinkCodeUseCase(
            link_code_repository=DjangoLinkCodeRepository(),
        )
        result = use_case.execute(GenerateLinkCodeCommand(user_id=request.user.id))
        serializer = GenerateLinkCodeResponseSerializer(
            {"code": result.code, "expires_at": result.expires_at}
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ---------------------------------------------------------------------------
# 学習記録一覧 API
# ---------------------------------------------------------------------------


class StudyRecordListView(APIView):
    """ログイン中ユーザーの学習記録一覧を返す API。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """学習記録一覧を返す。"""
        use_case = ListStudyRecordsUseCase(
            study_record_repository=DjangoStudyRecordRepository(),
        )
        records = use_case.execute(ListStudyRecordsCommand(user_id=request.user.id))
        serializer = StudyRecordResponseSerializer(
            [_record_to_dict(r) for r in records], many=True
        )
        return Response(serializer.data)


def _record_to_dict(record: object) -> dict:
    """StudyRecord エンティティをレスポンス用 dict に変換する。"""
    return {
        "id": str(record.id),
        "line_user_id": record.line_user_id,
        "plan_id": str(record.plan_id),
        "task_id": str(record.task_id),
        "study_date": str(record.study_date),
        "start_time": record.start_time.strftime("%H:%M"),
        "end_time": record.end_time.strftime("%H:%M"),
        "duration_minutes": record.duration_minutes,
        "responded_at": record.responded_at,
        "created_at": record.created_at,
    }
