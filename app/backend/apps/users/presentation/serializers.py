"""
ユーザー関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    """ユーザー登録リクエストのシリアライザー。"""

    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_password(self, value: str) -> str:
        """Django 標準のパスワードバリデーターを適用する。"""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value


class CreateCoachSerializer(serializers.Serializer):
    """コーチ作成リクエストのシリアライザー。"""

    email = serializers.EmailField()


class UserResponseSerializer(serializers.Serializer):
    """ユーザー情報レスポンスのシリアライザー。"""

    id = serializers.UUIDField()
    email = serializers.EmailField()
    username = serializers.CharField()
    is_staff = serializers.BooleanField()
    created_at = serializers.DateTimeField()
