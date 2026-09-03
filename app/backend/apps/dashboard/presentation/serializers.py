"""
ダッシュボード集計関連のシリアライザー。
データの変換のみ担当し、ビジネスロジックを持たない。
"""
from __future__ import annotations

from rest_framework import serializers


class DashboardSummarySerializer(serializers.Serializer):
    """ホーム画面向けサマリーレスポンスのシリアライザー。"""

    progress_percent = serializers.FloatField()
    today_study_minutes = serializers.IntegerField()
    streak_days = serializers.IntegerField()


class UnitProgressSerializer(serializers.Serializer):
    """単元（タスク）1件分の計画vs実績レスポンスのシリアライザー。"""

    task_id = serializers.UUIDField()
    title = serializers.CharField()
    status = serializers.CharField()
    planned_days = serializers.IntegerField()
    studied_days = serializers.IntegerField()
    extra_days = serializers.IntegerField()
    completion_rate = serializers.FloatField()


class PlanVsActualSerializer(serializers.Serializer):
    """計画画面向け計画vs実績レスポンスのシリアライザー。"""

    total_planned_days = serializers.IntegerField()
    total_studied_days = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    completed_count = serializers.IntegerField()
    delayed_count = serializers.IntegerField()
    postponed_count = serializers.IntegerField()
    on_track_count = serializers.IntegerField()
    unscheduled_count = serializers.IntegerField()
    units = UnitProgressSerializer(many=True)
