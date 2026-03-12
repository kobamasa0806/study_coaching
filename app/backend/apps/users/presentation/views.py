"""
ユーザー関連の API ビュー。
ビジネスロジックは application 層のユースケースに委譲する。
"""
from __future__ import annotations

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..application.use_cases import RegisterUserCommand, RegisterUserUseCase
from ..infrastructure.repositories import DjangoUserRepository
from .serializers import RegisterSerializer, UserResponseSerializer


class RegisterView(APIView):
    """ユーザー登録エンドポイント。"""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            use_case = RegisterUserUseCase(DjangoUserRepository())
            user = use_case.execute(
                RegisterUserCommand(
                    email=serializer.validated_data["email"],
                    username=serializer.validated_data["username"],
                    password=serializer.validated_data["password"],
                )
            )
        except ValueError as e:
            return Response(
                {"error": {"code": "ALREADY_EXISTS", "message": str(e)}},
                status=status.HTTP_409_CONFLICT,
            )

        response_serializer = UserResponseSerializer(
            {"id": user.id, "email": user.email, "username": user.username, "created_at": user.created_at}
        )
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


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
                "created_at": user.created_at,
            }
        )
        return Response(response_serializer.data)
