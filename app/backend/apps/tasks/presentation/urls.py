"""
タスク関連の URL ルーティング。
plans/{plan_id}/tasks/ 配下にネストされる。
"""
from __future__ import annotations

from django.urls import path

from .views import TaskDetailView, TaskListCreateView

urlpatterns = [
    # GET  /api/v1/plans/{plan_id}/tasks/           → タスク一覧
    # POST /api/v1/plans/{plan_id}/tasks/           → タスク作成
    path("", TaskListCreateView.as_view(), name="task-list-create"),
    # GET    /api/v1/plans/{plan_id}/tasks/{task_id}/ → タスク詳細
    # PUT    /api/v1/plans/{plan_id}/tasks/{task_id}/ → タスク更新
    # DELETE /api/v1/plans/{plan_id}/tasks/{task_id}/ → タスク削除
    path("<uuid:task_id>/", TaskDetailView.as_view(), name="task-detail"),
]
