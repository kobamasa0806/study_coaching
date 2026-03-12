"""
学習計画関連の API ビュー。
ビジネスロジックは application 層のユースケースに委譲する。
"""
from __future__ import annotations

from uuid import UUID

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..application.use_cases import (
    CreateStudyPlanCommand,
    CreateStudyPlanUseCase,
    DeleteStudyPlanUseCase,
    GetStudyPlanUseCase,
    ListStudyPlansUseCase,
    UpdateStudyPlanCommand,
    UpdateStudyPlanUseCase,
)
from ..domain.models import PlanStatus
from ..infrastructure.repositories import DjangoPlanRepository
from .serializers import CreatePlanSerializer, PlanResponseSerializer, UpdatePlanSerializer


def _plan_to_dict(plan: object) -> dict:
    """StudyPlan エンティティをレスポンス用 dict に変換する。"""
    return {
        "id": plan.id,
        "user_id": plan.user_id,
        "title": plan.title,
        "description": plan.description,
        "target_date": plan.target_date,
        "status": plan.status.value,
        "created_at": plan.created_at,
        "updated_at": plan.updated_at,
    }


class PlanListCreateView(APIView):
    """学習計画一覧取得・作成エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """ログイン中ユーザーの学習計画一覧を返す。"""
        use_case = ListStudyPlansUseCase(DjangoPlanRepository())
        plans = use_case.execute(user_id=request.user.id)
        serializer = PlanResponseSerializer([_plan_to_dict(p) for p in plans], many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """新規学習計画を作成する。"""
        serializer = CreatePlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        use_case = CreateStudyPlanUseCase(DjangoPlanRepository())
        plan = use_case.execute(
            CreateStudyPlanCommand(
                user_id=request.user.id,
                title=serializer.validated_data["title"],
                description=serializer.validated_data.get("description", ""),
                target_date=serializer.validated_data["target_date"],
            )
        )
        response_serializer = PlanResponseSerializer(_plan_to_dict(plan))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class PlanDetailView(APIView):
    """学習計画詳細・更新・削除エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID) -> Response:
        """学習計画の詳細を返す。"""
        try:
            use_case = GetStudyPlanUseCase(DjangoPlanRepository())
            plan = use_case.execute(plan_id=plan_id, user_id=request.user.id)
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except PermissionError as e:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        response_serializer = PlanResponseSerializer(_plan_to_dict(plan))
        return Response(response_serializer.data)

    def put(self, request: Request, plan_id: UUID) -> Response:
        """学習計画を更新する。"""
        serializer = UpdatePlanSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            use_case = UpdateStudyPlanUseCase(DjangoPlanRepository())
            plan = use_case.execute(
                UpdateStudyPlanCommand(
                    plan_id=plan_id,
                    user_id=request.user.id,
                    title=serializer.validated_data["title"],
                    description=serializer.validated_data.get("description", ""),
                    target_date=serializer.validated_data["target_date"],
                    status=PlanStatus(serializer.validated_data["status"]),
                )
            )
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except PermissionError as e:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        response_serializer = PlanResponseSerializer(_plan_to_dict(plan))
        return Response(response_serializer.data)

    def delete(self, request: Request, plan_id: UUID) -> Response:
        """学習計画を削除する。"""
        try:
            use_case = DeleteStudyPlanUseCase(DjangoPlanRepository())
            use_case.execute(plan_id=plan_id, user_id=request.user.id)
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )
        except PermissionError as e:
            return Response(
                {"error": {"code": "FORBIDDEN", "message": str(e)}},
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
