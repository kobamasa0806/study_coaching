"""
開発環境用の設定。
"""
from __future__ import annotations

from .base import *  # noqa: F401, F403

DEBUG = True

# 開発環境では全オリジンを許可
CORS_ALLOW_ALL_ORIGINS = True
