"""
管理画面 API ビュー。
is_staff=True のユーザーのみアクセス可能。
"""
from __future__ import annotations

import logging

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.plans.infrastructure.models import PlanModel
from apps.tasks.infrastructure.models import TaskModel
from apps.users.infrastructure.models import UserModel

audit_logger = logging.getLogger("audit")


def _get_client_ip(request: Request) -> str:
    """リクエスト元の IP アドレスを取得する。"""
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "unknown")


class AdminStatsView(APIView):
    """サービス全体の集計統計を返す。"""

    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        audit_logger.info(
            "管理者 API アクセス: endpoint=admin/stats user=%s ip=%s",
            getattr(request.user, "email", "unknown"),
            _get_client_ip(request),
        )
        now = timezone.now()
        # 当月初日 00:00:00 JST
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_users = UserModel.objects.count()
        new_users_this_month = UserModel.objects.filter(created_at__gte=month_start).count()
        # 1 件以上プランを持つユーザーを「活動中」とみなす
        active_users = UserModel.objects.filter(plans__isnull=False).distinct().count()

        total_plans = PlanModel.objects.count()
        plans_by_status = {
            s: PlanModel.objects.filter(status=s).count()
            for s in ["active", "completed", "archived"]
        }

        total_tasks = TaskModel.objects.count()
        tasks_by_status = {
            s: TaskModel.objects.filter(status=s).count()
            for s in ["pending", "in_progress", "completed"]
        }

        return Response(
            {
                "total_users": total_users,
                "active_users": active_users,
                "new_users_this_month": new_users_this_month,
                "total_plans": total_plans,
                "plans_by_status": plans_by_status,
                "total_tasks": total_tasks,
                "tasks_by_status": tasks_by_status,
            }
        )


class AdminUserListView(APIView):
    """ユーザー一覧と各ユーザーの利用状況を返す。"""

    permission_classes = [IsAdminUser]

    def get(self, request: Request) -> Response:
        audit_logger.info(
            "管理者 API アクセス: endpoint=admin/users user=%s ip=%s",
            getattr(request.user, "email", "unknown"),
            _get_client_ip(request),
        )
        users = (
            UserModel.objects.annotate(
                plan_count=Count("plans", distinct=True),
                completed_plan_count=Count(
                    "plans", filter=Q(plans__status="completed"), distinct=True
                ),
                task_count=Count("plans__tasks", distinct=True),
                completed_task_count=Count(
                    "plans__tasks",
                    filter=Q(plans__tasks__status="completed"),
                    distinct=True,
                ),
            )
            .order_by("-created_at")
        )

        data = [
            {
                "id": str(u.id),
                "email": u.email,
                "username": u.username,
                "is_active": u.is_active,
                "is_staff": u.is_staff,
                "created_at": u.created_at.isoformat(),
                "plan_count": u.plan_count,
                "completed_plan_count": u.completed_plan_count,
                "task_count": u.task_count,
                "completed_task_count": u.completed_task_count,
            }
            for u in users
        ]

        return Response(data)
