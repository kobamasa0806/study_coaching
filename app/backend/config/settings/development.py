"""
開発環境用の設定。
"""
from __future__ import annotations

from .base import *  # noqa: F401, F403

DEBUG = True

# 開発環境では localhost のみを明示的に許可する（CORS_ALLOW_ALL_ORIGINS は使用しない）
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
