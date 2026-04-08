"""
認証・ユーザー関連の URL ルーティング。
ログイン・トークン更新は Cognito SDK（フロントエンド）で直接行うため、
バックエンドには登録・ユーザー情報取得・ログアウトのエンドポイントのみ用意する。
"""
from __future__ import annotations

from django.urls import path

from .views import LogoutView, MeView, RegisterView

urlpatterns = [
    # POST /api/v1/auth/register/  → ユーザー登録（Cognito + ローカル DB）
    path("register/", RegisterView.as_view(), name="auth-register"),
    # GET  /api/v1/auth/me/        → ログイン中ユーザー情報
    path("me/", MeView.as_view(), name="auth-me"),
    # POST /api/v1/auth/logout/    → ログアウト（サーバーサイド処理）
    path("logout/", LogoutView.as_view(), name="auth-logout"),
]
