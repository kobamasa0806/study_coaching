"""
URL ルーティング設定。
"""
from __future__ import annotations

from django.contrib import admin
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.urls import include, path
from decouple import config

# Django 管理画面のパスをデフォルトの /admin/ から変更してスキャン対策とする
# 本番環境では DJANGO_ADMIN_URL 環境変数で任意のパスに変更すること
_ADMIN_URL: str = config("DJANGO_ADMIN_URL", default="admin/")


# ALB / EC2 / Docker のヘルスチェック用エンドポイント。DB 等への接続は行わず軽量に保つ
def healthz(_request: HttpRequest) -> HttpResponse:
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("healthz/", healthz),
    path(_ADMIN_URL, admin.site.urls),
    path("api/v1/auth/", include("apps.users.presentation.urls")),
    path("api/v1/plans/", include("apps.plans.presentation.urls")),
    path("api/v1/plans/<uuid:plan_id>/tasks/", include("apps.tasks.presentation.urls")),
    path("api/v1/sessions/", include("apps.sessions.presentation.urls")),
    path("api/v1/admin/", include("apps.admin_panel.presentation.urls")),
]
