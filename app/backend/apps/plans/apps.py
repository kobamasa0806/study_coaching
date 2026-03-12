"""
学習計画アプリの設定。
"""
from __future__ import annotations

from django.apps import AppConfig


class PlansConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.plans"
    verbose_name = "学習計画"

    def ready(self) -> None:
        # ORM モデルを infrastructure 層から読み込む
        from apps.plans.infrastructure import models  # noqa: F401
