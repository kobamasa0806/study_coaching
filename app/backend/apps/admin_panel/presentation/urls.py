"""
管理画面 API の URL ルーティング。
"""
from __future__ import annotations

from django.urls import path

from .views import AdminStatsView, AdminUserListView

urlpatterns = [
    # GET /api/v1/admin/stats/  → サービス統計
    path("stats/", AdminStatsView.as_view(), name="admin-stats"),
    # GET /api/v1/admin/users/  → ユーザー一覧＋利用状況
    path("users/", AdminUserListView.as_view(), name="admin-users"),
]
