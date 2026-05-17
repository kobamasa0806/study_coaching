"""
認証・ユーザー関連の URL ルーティング。
認証は Cognito Hosted UI が担当するため、バックエンドは /me/ のみを提供する。
"""
from __future__ import annotations

from django.urls import path

from .views import MeView

urlpatterns = [
    # GET /api/v1/auth/me/ → ログイン中ユーザー情報（Cognito id_token で認証）
    path("me/", MeView.as_view(), name="auth-me"),
]
