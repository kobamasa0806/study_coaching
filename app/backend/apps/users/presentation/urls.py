"""
認証・ユーザー関連の URL ルーティング。
"""
from __future__ import annotations

from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import MeView, RegisterView

urlpatterns = [
    # POST /api/v1/auth/register/  → ユーザー登録
    path("register/", RegisterView.as_view(), name="auth-register"),
    # POST /api/v1/auth/token/     → JWT トークン取得（ログイン）
    path("token/", TokenObtainPairView.as_view(), name="auth-token-obtain"),
    # POST /api/v1/auth/token/refresh/  → アクセストークン更新
    path("token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    # GET  /api/v1/auth/me/        → ログイン中ユーザー情報
    path("me/", MeView.as_view(), name="auth-me"),
]
