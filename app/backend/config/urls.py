"""
URL ルーティング設定。
"""
from __future__ import annotations

from django.contrib import admin
from django.urls import include, path
from decouple import config

# Django 管理画面のパスをデフォルトの /admin/ から変更してスキャン対策とする
# 本番環境では DJANGO_ADMIN_URL 環境変数で任意のパスに変更すること
_ADMIN_URL: str = config("DJANGO_ADMIN_URL", default="admin/")

urlpatterns = [
    path(_ADMIN_URL, admin.site.urls),
    path("api/v1/auth/", include("apps.users.presentation.urls")),
    path("api/v1/plans/", include("apps.plans.presentation.urls")),
    path("api/v1/plans/<uuid:plan_id>/tasks/", include("apps.tasks.presentation.urls")),
    path("api/v1/sessions/", include("apps.sessions.presentation.urls")),
    path("api/v1/admin/", include("apps.admin_panel.presentation.urls")),
    path("api/v1/contact/", include("apps.contact.presentation.urls")),
]
