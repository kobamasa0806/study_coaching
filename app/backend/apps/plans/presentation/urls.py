"""
学習計画関連の URL ルーティング。
"""
from __future__ import annotations

from django.urls import path

from .views import PlanDetailView, PlanListCreateView

urlpatterns = [
    # GET  /api/v1/plans/       → 学習計画一覧
    # POST /api/v1/plans/       → 学習計画作成
    path("", PlanListCreateView.as_view(), name="plan-list-create"),
    # GET    /api/v1/plans/{id}/ → 学習計画詳細
    # PUT    /api/v1/plans/{id}/ → 学習計画更新
    # DELETE /api/v1/plans/{id}/ → 学習計画削除
    path("<uuid:plan_id>/", PlanDetailView.as_view(), name="plan-detail"),
]
