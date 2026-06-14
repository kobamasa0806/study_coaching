"""
staging 環境用の設定。
本番に近い構成だが、ローカル Docker 検証時は TLS 関連を環境変数で無効化できるようにする。
"""
from __future__ import annotations

from decouple import config

from .base import *  # noqa: F401, F403

DEBUG = False

# 静的ファイル配信先
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"  # noqa: F405
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"  # noqa: F405

# nginx などのリバースプロキシ経由で配信するため、X-Forwarded-Proto を信頼する
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# ローカル Docker 検証時は ENABLE_HTTPS=0 にして HTTPS 強制を無効化できる
_ENABLE_HTTPS: bool = config("ENABLE_HTTPS", default=True, cast=bool)

SECURE_SSL_REDIRECT = _ENABLE_HTTPS
SESSION_COOKIE_SECURE = _ENABLE_HTTPS
CSRF_COOKIE_SECURE = _ENABLE_HTTPS

# HSTS は本番相当の長さにはせず、staging では 1 日に留める
SECURE_HSTS_SECONDS = 86400 if _ENABLE_HTTPS else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = _ENABLE_HTTPS
SECURE_HSTS_PRELOAD = False

SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600
