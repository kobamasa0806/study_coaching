"""
勉強記録関連の URL ルーティング。
plans/{plan_id}/study-logs/ 配下にネストされる。
"""
from __future__ import annotations

from django.urls import path

from .views import StudyLogDetailView, StudyLogListCreateView, StudyLogStatsView

urlpatterns = [
    # GET  /api/v1/plans/{plan_id}/study-logs/        → 勉強記録一覧
    # POST /api/v1/plans/{plan_id}/study-logs/        → 勉強記録作成
    path("", StudyLogListCreateView.as_view(), name="study-log-list-create"),
    # GET /api/v1/plans/{plan_id}/study-logs/stats/   → 勉強記録の集計
    path("stats/", StudyLogStatsView.as_view(), name="study-log-stats"),
    # DELETE /api/v1/plans/{plan_id}/study-logs/{id}/ → 勉強記録削除
    path("<uuid:log_id>/", StudyLogDetailView.as_view(), name="study-log-detail"),
]
