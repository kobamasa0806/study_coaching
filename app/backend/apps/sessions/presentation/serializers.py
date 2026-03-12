"""
セッション関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from rest_framework import serializers

from ..domain.models import SessionStatus


class CreateSessionSerializer(serializers.Serializer):
    """セッション作成リクエストのシリアライザー。"""

    scheduled_at = serializers.DateTimeField()
    memo = serializers.CharField(default="", allow_blank=True)


class UpdateSessionSerializer(serializers.Serializer):
    """セッション更新リクエストのシリアライザー。"""

    scheduled_at = serializers.DateTimeField()
    memo = serializers.CharField(default="", allow_blank=True)
    summary = serializers.CharField(default="", allow_blank=True)
    status = serializers.ChoiceField(choices=[s.value for s in SessionStatus])


class SessionResponseSerializer(serializers.Serializer):
    """セッションレスポンスのシリアライザー。"""

    id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    scheduled_at = serializers.DateTimeField()
    memo = serializers.CharField()
    summary = serializers.CharField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
