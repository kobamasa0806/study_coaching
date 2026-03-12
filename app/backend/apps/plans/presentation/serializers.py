"""
学習計画関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from rest_framework import serializers

from ..domain.models import PlanStatus


class CreatePlanSerializer(serializers.Serializer):
    """学習計画作成リクエストのシリアライザー。"""

    title = serializers.CharField(max_length=255)
    description = serializers.CharField(default="", allow_blank=True)
    target_date = serializers.DateField()


class UpdatePlanSerializer(serializers.Serializer):
    """学習計画更新リクエストのシリアライザー。"""

    title = serializers.CharField(max_length=255)
    description = serializers.CharField(default="", allow_blank=True)
    target_date = serializers.DateField()
    status = serializers.ChoiceField(choices=[s.value for s in PlanStatus])


class PlanResponseSerializer(serializers.Serializer):
    """学習計画レスポンスのシリアライザー。"""

    id = serializers.UUIDField()
    user_id = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField()
    target_date = serializers.DateField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
