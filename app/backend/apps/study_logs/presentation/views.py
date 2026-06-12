"""
勉強記録関連の API ビュー。
ビジネスロジックは application 層のユースケースに委譲する。
plans/{plan_id}/study-logs/ 配下にネストされる。
"""
from __future__ import annotations

from uuid import UUID

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.plans.application.use_cases import GetStudyPlanUseCase
from apps.plans.infrastructure.repositories import DjangoPlanRepository

from ..application.use_cases import (
    CreateStudyLogCommand,
    CreateStudyLogUseCase,
    DeleteStudyLogUseCase,
    GetStudyLogStatsUseCase,
    ListStudyLogsUseCase,
)
from ..domain.models import StudyLog
from ..infrastructure.repositories import DjangoStudyLogRepository
from .serializers import (
    CreateStudyLogSerializer,
    StudyLogResponseSerializer,
    StudyLogStatsSerializer,
)


def _study_log_to_dict(log: StudyLog) -> dict:
    """StudyLog エンティティをレスポンス用 dict に変換する。"""
    return {
        "id": log.id,
        "task_id": log.task_id,
        "studied_on": log.studied_on,
        "start_time": log.start_time,
        "end_time": log.end_time,
        "duration_minutes": log.duration_minutes,
        "memo": log.memo,
        "created_at": log.created_at,
        "updated_at": log.updated_at,
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


class StudyLogListCreateView(APIView):
    """勉強記録の一覧取得・作成エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID) -> Response:
        """計画に紐づく勉強記録一覧を返す。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        use_case = ListStudyLogsUseCase(DjangoStudyLogRepository())
        logs = use_case.execute(plan_id=plan_id)
        serializer = StudyLogResponseSerializer(
            [_study_log_to_dict(log) for log in logs], many=True
        )
        return Response(serializer.data)

    def post(self, request: Request, plan_id: UUID) -> Response:
        """新規勉強記録を作成する。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CreateStudyLogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            use_case = CreateStudyLogUseCase(DjangoStudyLogRepository())
            log = use_case.execute(
                CreateStudyLogCommand(
                    user_id=request.user.id,
                    plan_id=plan_id,
                    task_id=serializer.validated_data["task_id"],
                    studied_on=serializer.validated_data["studied_on"],
                    start_time=serializer.validated_data["start_time"],
                    end_time=serializer.validated_data["end_time"],
                    memo=serializer.validated_data.get("memo", ""),
                )
            )
        except ValueError as e:
            return Response(
                {"error": {"code": "BAD_REQUEST", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = StudyLogResponseSerializer(_study_log_to_dict(log))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class StudyLogDetailView(APIView):
    """勉強記録の削除エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, plan_id: UUID, log_id: UUID) -> Response:
        """勉強記録を削除する。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            use_case = DeleteStudyLogUseCase(DjangoStudyLogRepository())
            use_case.execute(log_id=log_id, plan_id=plan_id)
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class StudyLogStatsView(APIView):
    """勉強記録の集計（合計時間・時間帯別分布）エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID) -> Response:
        """計画の勉強記録を集計して返す。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        use_case = GetStudyLogStatsUseCase(DjangoStudyLogRepository())
        stats = use_case.execute(plan_id=plan_id)
        serializer = StudyLogStatsSerializer(
            {
                "total_minutes": stats.total_minutes,
                "log_count": stats.log_count,
                "hourly_minutes": stats.hourly_minutes,
            }
        )
        return Response(serializer.data)
