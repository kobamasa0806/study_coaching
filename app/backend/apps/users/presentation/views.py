"""
ユーザー関連の API ビュー。
認証は AWS Cognito JWT で行い、ユーザー情報は Django DB から取得する。
"""
from __future__ import annotations

from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import UserResponseSerializer


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
