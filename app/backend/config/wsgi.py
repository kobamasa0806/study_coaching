"""
WSGI 設定。
"""
from __future__ import annotations

import os

from django.core.wsgi import get_wsgi_application

# 環境変数 DJANGO_SETTINGS_MODULE が未設定の場合は本番設定をデフォルトにする
# 開発環境では .env に DJANGO_SETTINGS_MODULE=config.settings.development を設定すること
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.production")

application = get_wsgi_application()
