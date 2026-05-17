"""
本番環境用の設定。
開発環境との差分のみ記述する。
"""
from __future__ import annotations

from .base import *  # noqa: F401, F403

DEBUG = False

# 本番環境では HTTPS を強制する
SECURE_SSL_REDIRECT = True
# AWS ALB / Nginx などのリバースプロキシが X-Forwarded-Proto を付与する場合に使用する
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# HSTS: ブラウザに HTTPS 接続を強制させる（1年間）
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cookie を HTTPS 限定・HttpOnly にする
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# セッションの有効期限を1時間に制限する
SESSION_COOKIE_AGE = 3600
