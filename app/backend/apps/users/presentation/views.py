"""
ユーザー関連の API ビュー。
認証は AWS Cognito JWT で行い、ユーザー情報は Django DB から取得する。
"""
from __future__ import annotations

import logging

from rest_framework import status
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.application.use_cases import CreateCoachCommand, CreateCoachUseCase
from apps.users.infrastructure.cognito_admin import CognitoAdminService, CoachCreationError

from .serializers import CreateCoachSerializer, UserResponseSerializer

audit_logger = logging.getLogger("audit")


class MeView(APIView):
    """ログイン中ユーザー情報取得エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        response_serializer = UserResponseSerializer(
            {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "is_staff": user.is_staff,
                "created_at": user.created_at,
            }
        )
        return Response(response_serializer.data)


class CreateCoachView(APIView):
    """コーチアカウント作成エンドポイント。coaches グループのユーザーのみ実行可能。"""

    permission_classes = [IsAdminUser]

    def post(self, request: Request) -> Response:
        serializer = CreateCoachSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email: str = serializer.validated_data["email"]

        audit_logger.info(
            "コーチ作成: 実行者=%s 対象メール=%s",
            getattr(request.user, "email", "unknown"),
            email,
        )

        use_case = CreateCoachUseCase(CognitoAdminService())
        try:
            use_case.execute(CreateCoachCommand(email=email))
        except CoachCreationError as e:
            return Response(
                {"error": {"code": "coach_creation_failed", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(status=status.HTTP_201_CREATED)
