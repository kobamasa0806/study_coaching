"""
勉強記録関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from rest_framework import serializers


class CreateStudyLogSerializer(serializers.Serializer):
    """勉強記録作成リクエストのシリアライザー。"""

    task_id = serializers.UUIDField()
    studied_on = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    memo = serializers.CharField(default="", allow_blank=True)


class StudyLogResponseSerializer(serializers.Serializer):
    """勉強記録レスポンスのシリアライザー。"""

    id = serializers.UUIDField()
    task_id = serializers.UUIDField()
    studied_on = serializers.DateField()
    start_time = serializers.TimeField()
    end_time = serializers.TimeField()
    # 勉強分数はドメインで自動計算した値を返す
    duration_minutes = serializers.IntegerField()
    memo = serializers.CharField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()


class StudyLogStatsSerializer(serializers.Serializer):
    """勉強記録の集計結果レスポンスのシリアライザー。"""

    total_minutes = serializers.IntegerField()
    log_count = serializers.IntegerField()
    hourly_minutes = serializers.ListField(child=serializers.IntegerField())
