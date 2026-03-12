"""
タスク関連の API ビュー。
ビジネスロジックは application 層のユースケースに委譲する。
plans/{plan_id}/tasks/ 配下にネストされる。
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
    CreateTaskCommand,
    CreateTaskUseCase,
    DeleteTaskUseCase,
    GetTaskUseCase,
    ListTasksUseCase,
    UpdateTaskCommand,
    UpdateTaskUseCase,
)
from ..domain.models import TaskStatus
from ..infrastructure.repositories import DjangoTaskRepository
from .serializers import CreateTaskSerializer, TaskResponseSerializer, UpdateTaskSerializer


def _task_to_dict(task: object) -> dict:
    """Task エンティティをレスポンス用 dict に変換する。"""
    return {
        "id": task.id,
        "plan_id": task.plan_id,
        "title": task.title,
        "description": task.description,
        "plan_dates": task.plan_dates,
        "actual_dates": task.actual_dates,
        "start_date": task.start_date,
        "end_date": task.end_date,
        "status": task.status.value,
        "order": task.order,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
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


class TaskListCreateView(APIView):
    """タスク一覧取得・作成エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID) -> Response:
        """計画に紐づくタスク一覧を返す。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        use_case = ListTasksUseCase(DjangoTaskRepository())
        tasks = use_case.execute(plan_id=plan_id)
        serializer = TaskResponseSerializer([_task_to_dict(t) for t in tasks], many=True)
        return Response(serializer.data)

    def post(self, request: Request, plan_id: UUID) -> Response:
        """新規タスクを作成する。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CreateTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            use_case = CreateTaskUseCase(DjangoTaskRepository())
            task = use_case.execute(
                CreateTaskCommand(
                    plan_id=plan_id,
                    title=serializer.validated_data["title"],
                    description=serializer.validated_data.get("description", ""),
                    plan_dates=serializer.validated_data.get("plan_dates", []),
                    actual_dates=serializer.validated_data.get("actual_dates", []),
                    start_date=serializer.validated_data.get("start_date"),
                    end_date=serializer.validated_data.get("end_date"),
                )
            )
        except ValueError as e:
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": str(e)}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        response_serializer = TaskResponseSerializer(_task_to_dict(task))
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """タスク詳細・更新・削除エンドポイント。"""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, plan_id: UUID, task_id: UUID) -> Response:
        """タスクの詳細を返す。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            use_case = GetTaskUseCase(DjangoTaskRepository())
            task = use_case.execute(task_id=task_id, plan_id=plan_id)
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )

        response_serializer = TaskResponseSerializer(_task_to_dict(task))
        return Response(response_serializer.data)

    def put(self, request: Request, plan_id: UUID, task_id: UUID) -> Response:
        """タスクを更新する。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"error": {"code": "VALIDATION_ERROR", "message": serializer.errors}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            use_case = UpdateTaskUseCase(DjangoTaskRepository())
            task = use_case.execute(
                UpdateTaskCommand(
                    task_id=task_id,
                    plan_id=plan_id,
                    title=serializer.validated_data["title"],
                    description=serializer.validated_data.get("description", ""),
                    plan_dates=serializer.validated_data.get("plan_dates", []),
                    actual_dates=serializer.validated_data.get("actual_dates", []),
                    start_date=serializer.validated_data.get("start_date"),
                    end_date=serializer.validated_data.get("end_date"),
                    status=TaskStatus(serializer.validated_data["status"]),
                    order=serializer.validated_data["order"],
                )
            )
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )

        response_serializer = TaskResponseSerializer(_task_to_dict(task))
        return Response(response_serializer.data)

    def delete(self, request: Request, plan_id: UUID, task_id: UUID) -> Response:
        """タスクを削除する。"""
        if not _verify_plan_access(plan_id, request.user.id):
            return Response(
                {"error": {"code": "NOT_FOUND", "message": "学習計画が見つかりません。"}},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            use_case = DeleteTaskUseCase(DjangoTaskRepository())
            use_case.execute(task_id=task_id, plan_id=plan_id)
        except ValueError as e:
            return Response(
                {"error": {"code": "NOT_FOUND", "message": str(e)}},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(status=status.HTTP_204_NO_CONTENT)
