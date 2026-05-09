"""
管理画面アプリの設定。
"""
from __future__ import annotations

from django.apps import AppConfig


class AdminPanelConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.admin_panel"
    verbose_name = "管理画面"
