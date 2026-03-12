#!/usr/bin/env python
"""Django のコマンドラインユーティリティ。"""
from __future__ import annotations

import os
import sys


def main() -> None:
    """管理コマンドを実行する。"""
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Django をインポートできませんでした。仮想環境が有効化されているか確認してください。"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
