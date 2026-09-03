"""
ダッシュボード集計関連の URL ルーティング。
plans/{plan_id}/dashboard/ 配下にネストされる。
"""
from __future__ import annotations

from django.urls import path

from .views import DashboardSummaryView, PlanVsActualView

urlpatterns = [
    # GET /api/v1/plans/{plan_id}/dashboard/summary/       → ホーム画面向けサマリー
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    # GET /api/v1/plans/{plan_id}/dashboard/plan-progress/ → 計画画面向け計画vs実績
    path("plan-progress/", PlanVsActualView.as_view(), name="dashboard-plan-progress"),
]
