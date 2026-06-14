#!/bin/sh
set -e

# DB 接続が確立するまで待機する（最大 30 秒）
echo "[entrypoint] DB 接続を待機中..."
python <<'PY'
import os, time, sys
import socket

host = os.environ.get("DB_HOST", "db")
port = int(os.environ.get("DB_PORT", "5432"))
deadline = time.time() + 30
while time.time() < deadline:
    try:
        with socket.create_connection((host, port), timeout=2):
            print(f"[entrypoint] DB {host}:{port} へ接続できました")
            sys.exit(0)
    except OSError:
        time.sleep(1)
print(f"[entrypoint] DB {host}:{port} へ接続できませんでした", file=sys.stderr)
sys.exit(1)
PY

# マイグレーション適用
echo "[entrypoint] migrate を実行..."
python manage.py migrate --noinput

# 静的ファイル収集（staticfiles 配信を nginx 経由で行う場合に必要）
if [ "${COLLECTSTATIC:-1}" = "1" ]; then
  echo "[entrypoint] collectstatic を実行..."
  python manage.py collectstatic --noinput
fi

# CMD で渡されたコマンド（gunicorn）を実行
exec "$@"
