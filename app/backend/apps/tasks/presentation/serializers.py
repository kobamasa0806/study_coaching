"""
タスク関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from rest_framework import serializers

from ..domain.models import TaskStatus


class CreateTaskSerializer(serializers.Serializer):
    """タスク作成リクエストのシリアライザー。"""

    title = serializers.CharField(max_length=255)
    description = serializers.CharField(default="", allow_blank=True)
    plan_dates = serializers.ListField(child=serializers.CharField(), default=list)
    actual_dates = serializers.ListField(child=serializers.CharField(), default=list)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)


class UpdateTaskSerializer(serializers.Serializer):
    """タスク更新リクエストのシリアライザー。"""

    title = serializers.CharField(max_length=255)
    description = serializers.CharField(default="", allow_blank=True)
    plan_dates = serializers.ListField(child=serializers.CharField(), default=list)
    actual_dates = serializers.ListField(child=serializers.CharField(), default=list)
    status = serializers.ChoiceField(choices=[s.value for s in TaskStatus])
    order = serializers.IntegerField(min_value=1)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)


class TaskResponseSerializer(serializers.Serializer):
    """タスクレスポンスのシリアライザー。"""

    id = serializers.UUIDField()
    plan_id = serializers.UUIDField()
    title = serializers.CharField()
    description = serializers.CharField()
    plan_dates = serializers.ListField(child=serializers.CharField())
    actual_dates = serializers.ListField(child=serializers.CharField())
    start_date = serializers.DateField(allow_null=True)
    end_date = serializers.DateField(allow_null=True)
    status = serializers.CharField()
    order = serializers.IntegerField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
