"""
勉強記録アプリの設定。
"""
from __future__ import annotations

from django.apps import AppConfig


class StudyLogsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.study_logs"
    verbose_name = "勉強記録"
