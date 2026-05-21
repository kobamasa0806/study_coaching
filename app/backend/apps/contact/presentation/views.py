"""
お問い合わせ API ビュー。
認証不要（未ログインユーザーからも問い合わせを受け付ける）。
"""
from __future__ import annotations

import logging

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.contact.application.use_cases import SendContactEmailCommand, SendContactEmailUseCase
from apps.contact.infrastructure.email_service import DjangoEmailService

from .serializers import ContactSerializer

logger = logging.getLogger(__name__)


class ContactView(APIView):
    """お問い合わせメール送信エンドポイント。"""

    permission_classes = [AllowAny]

    def post(self, request: Request) -> Response:
        serializer = ContactSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "validation_error", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        command = SendContactEmailCommand(**serializer.validated_data)
        use_case = SendContactEmailUseCase(email_service=DjangoEmailService())

        try:
            use_case.execute(command)
        except Exception:
            logger.exception("お問い合わせメール送信に失敗しました")
            return Response(
                {"error": {"code": "mail_send_error", "message": "メールの送信に失敗しました。しばらくしてから再度お試しください。"}},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({"message": "お問い合わせを受け付けました。"}, status=status.HTTP_200_OK)
