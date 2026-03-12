"""
ユーザー関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from rest_framework import serializers


class RegisterSerializer(serializers.Serializer):
    """ユーザー登録リクエストのシリアライザー。"""

    email = serializers.EmailField()
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=8, write_only=True)


class UserResponseSerializer(serializers.Serializer):
    """ユーザー情報レスポンスのシリアライザー。"""

    id = serializers.UUIDField()
    email = serializers.EmailField()
    username = serializers.CharField()
    created_at = serializers.DateTimeField()
