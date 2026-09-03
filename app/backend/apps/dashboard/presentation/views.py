"""
ダッシュボード集計関連の API ビュー。
ビジネスロジックは application 層のユースケースに委譲する。
plans/{plan_id}/dashboard/ 配下にネストされる。
"""
from __future__ import annotations

from uuid import UUID

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.plans.application.use_cases import GetStudyPlanUseCase
from apps.plans.infrastructure.repositories import DjangoPlanRepository
from apps.study_logs.infrastructure.repositories import DjangoStudyLogRepository
from apps.tasks.infrastructure.repositories import DjangoTaskRepository

from ..application.use_cases import GetDashboardSummaryUseCase, GetPlanVsActualUseCase
from ..domain.models import DashboardSummary, PlanVsActual, UnitProgress
from .serializers import DashboardSummarySerializer, PlanVsActualSerializer


def _unit_progress_to_dict(unit: UnitProgress) -> dict:
    """UnitProgress エンティティをレスポンス用 dict に変換する（Enumは.valueで文字列化）。"""
    return {
        "task_id": unit.task_id,
        "title": unit.title,
        "status": unit.status.value,
        "planned_days": unit.planned_days,
        "studied_days": unit.studied_days,
        "extra_days": unit.extra_days,
        "completion_rate": unit.completion_rate,
    }


def _plan_vs_actual_to_dict(result: PlanVsActual) -> dict:
    """PlanVsActual エンティティをレスポンス用 dict に変換する。"""
    return {
        "total_planned_days": result.total_planned_days,
        "total_studied_days": result.total_studied_days,
        "completion_rate": result.completion_rate,
        "completed_count": result.completed_count,
        "delayed_count": result.delayed_count,
        "postponed_count": result.postponed_count,
        "on_track_count": result.on_track_count,
        "unscheduled_count": result.unscheduled_count,
        "units": [_unit_progress_to_dict(unit) for unit in result.units],
    }


def _dashboard_summary_to_dict(summary: DashboardSummary) -> dict:
    """DashboardSummary エンティティをレスポンス用 dict に変換する。"""
    return {
        "progress_percent": summary.progress_percent,
        "today_study_minutes": summary.today_study_minutes,
        "streak_days": summary.streak_days,
    }


def _verify_plan_access(plan_id: UUID, user_id: UUID) -> bool:
    """
    ログイン中ユーザーが指定の計画にアクセス可能か検証する。
    存在しない・権限がない場合は False を返す。
    """
    try:
        GetStudyPlanUseCase(DjangoPlanRepository()).execute(
            plan_id=plan_id, user_id=user_id
        )
        return True
    except (ValueError, PermissionError):
        return False


class DashboardSummaryView(APIView):
    """ホーム画面向けサマリー取得エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID) -> Response:
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        use_case = GetDashboardSummaryUseCase(
            DjangoTaskRepository(), DjangoStudyLogRepository()
        )
        summary = use_case.execute(plan_id=plan_id, today=timezone.localdate())
        serializer = DashboardSummarySerializer(_dashboard_summary_to_dict(summary))
        return Response(serializer.data)


class PlanVsActualView(APIView):
    """計画画面向け計画vs実績取得エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID) -> Response:
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        use_case = GetPlanVsActualUseCase(DjangoPlanRepository(), DjangoTaskRepository())
        try:
            result = use_case.execute(plan_id=plan_id, today=timezone.localdate())
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PlanVsActualSerializer(_plan_vs_actual_to_dict(result))
        return Response(serializer.data)
