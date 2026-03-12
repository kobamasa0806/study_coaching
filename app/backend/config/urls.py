"""
URL ルーティング設定。
"""
from __future__ import annotations

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.users.presentation.urls")),
    path("api/v1/plans/", include("apps.plans.presentation.urls")),
    path("api/v1/plans/<uuid:plan_id>/tasks/", include("apps.tasks.presentation.urls")),
    path("api/v1/sessions/", include("apps.sessions.presentation.urls")),
]
