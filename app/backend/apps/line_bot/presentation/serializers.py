"""
LINE Bot 関連の DRF シリアライザー。
"""
from __future__ import annotations

from rest_framework import serializers


class GenerateLinkCodeResponseSerializer(serializers.Serializer):
    """LINE 紐付けコード発行レスポンスシリアライザー。"""

    code = serializers.CharField()
    expires_at = serializers.DateTimeField()


class StudyRecordResponseSerializer(serializers.Serializer):
    """学習記録レスポンスシリアライザー。"""

    id = serializers.UUIDField()
    line_user_id = serializers.CharField()
    plan_id = serializers.UUIDField()
    task_id = serializers.UUIDField()
    study_date = serializers.DateField()
    start_time = serializers.CharField()
    end_time = serializers.CharField()
    duration_minutes = serializers.IntegerField()
    responded_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()
