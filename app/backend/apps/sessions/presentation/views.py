"""
セッション関連の API ビュー。
ビジネスロジックは application 層のユースケースに委譲する。
"""
from __future__ import annotations

from uuid import UUID

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..application.use_cases import (
    CreateSessionCommand,
    CreateSessionUseCase,
    DeleteSessionUseCase,
    GetSessionUseCase,
    ListSessionsUseCase,
    UpdateSessionCommand,
    UpdateSessionUseCase,
)
from ..domain.models import SessionStatus
from ..infrastructure.repositories import DjangoSessionRepository
from .serializers import CreateSessionSerializer, SessionResponseSerializer, UpdateSessionSerializer


def _session_to_dict(session: object) -> dict:
    """Session エンティティをレスポンス用 dict に変換する。"""
    return {
        "id": session.id,
        "user_id": session.user_id,
        "scheduled_at": session.scheduled_at,
        "memo": session.memo,
        "summary": session.summary,
        "status": session.status.value,
        "created_at": session.created_at,
        "updated_at": session.updated_at,
    }


class SessionListCreateView(APIView):
    """セッション一覧取得・作成エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """ログイン中ユーザーのセッション一覧を返す。"""
        use_case = ListSessionsUseCase(DjangoSessionRepository())
        sessions = use_case.execute(user_id=request.user.id)
        serializer = SessionResponseSerializer(
            [_session_to_dict(s) for s in sessions], many=True
        )
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """新規セッションを作成する。"""
        serializer = CreateSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        use_case = CreateSessionUseCase(DjangoSessionRepository())
        session = use_case.execute(
            CreateSessionCommand(
                user_id=request.user.id,
                scheduled_at=serializer.validated_data["scheduled_at"],
                memo=serializer.validated_data.get("memo", ""),
            )
        )
        response_serializer = SessionResponseSerializer(_session_to_dict(session))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class SessionDetailView(APIView):
    """セッション詳細・更新・削除エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, session_id: UUID) -> Response:
        """セッションの詳細を返す。"""
        try:
            use_case = GetSessionUseCase(DjangoSessionRepository())
            session = use_case.execute(session_id=session_id, user_id=request.user.id)
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except PermissionError as e:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        response_serializer = SessionResponseSerializer(_session_to_dict(session))
        return Response(response_serializer.data)

    def put(self, request: Request, session_id: UUID) -> Response:
        """セッションを更新する。"""
        serializer = UpdateSessionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            use_case = UpdateSessionUseCase(DjangoSessionRepository())
            session = use_case.execute(
                UpdateSessionCommand(
                    session_id=session_id,
                    user_id=request.user.id,
                    scheduled_at=serializer.validated_data["scheduled_at"],
                    memo=serializer.validated_data.get("memo", ""),
                    summary=serializer.validated_data.get("summary", ""),
                    status=SessionStatus(serializer.validated_data["status"]),
                )
            )
        except ValueError as e:
            return Response(
                {"error": {"code": "BAD_REQUEST", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PermissionError as e:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        response_serializer = SessionResponseSerializer(_session_to_dict(session))
        return Response(response_serializer.data)

    def delete(self, request: Request, session_id: UUID) -> Response:
        """セッションを削除する。"""
        try:
            use_case = DeleteSessionUseCase(DjangoSessionRepository())
            use_case.execute(session_id=session_id, user_id=request.user.id)
        except ValueError as e:
            return Response(
                {"error": {"code": "BAD_REQUEST", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except PermissionError as e:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
