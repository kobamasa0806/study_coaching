"""
セッション関連の URL ルーティング。
"""
from __future__ import annotations

from django.urls import path

from .views import SessionDetailView, SessionListCreateView

urlpatterns = [
    # GET  /api/v1/sessions/           → セッション一覧
    # POST /api/v1/sessions/           → セッション作成
    path("", SessionListCreateView.as_view(), name="session-list-create"),
    # GET    /api/v1/sessions/{id}/    → セッション詳細
    # PUT    /api/v1/sessions/{id}/    → セッション更新
    # DELETE /api/v1/sessions/{id}/    → セッション削除
    path("<uuid:session_id>/", SessionDetailView.as_view(), name="session-detail"),
]
