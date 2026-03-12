"""
セッションアプリの設定。
"""
from __future__ import annotations

from django.apps import AppConfig


class SessionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.sessions"
    # django.contrib.sessions とのラベル衝突を避けるため独自ラベルを設定する
    label = "coaching_sessions"
    verbose_name = "セッション"
