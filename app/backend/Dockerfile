# syntax=docker/dockerfile:1.7
# ===== ビルドステージ =====
# psycopg2-binary など wheel が用意されているライブラリのみを使うため slim で十分
FROM python:3.12-slim-bookworm AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# ビルド時に必要な OS パッケージ（一部 wheel が無いライブラリ向けの保険）
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 依存解決を先に行いレイヤキャッシュを効かせる
COPY requirements/base.txt requirements/production.txt requirements/
RUN pip install --prefix=/install -r requirements/production.txt


# ===== 実行ステージ =====
FROM python:3.12-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.staging \
    PORT=8000

# 実行時のみ必要なライブラリ（psycopg2-binary 用 libpq）
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq5 \
        curl \
    && rm -rf /var/lib/apt/lists/*

# 非 root ユーザーで実行する
RUN groupadd --system app && useradd --system --gid app --create-home app

WORKDIR /app

# ビルドステージで作った site-packages をコピー
COPY --from=builder /install /usr/local

# アプリケーションコードをコピー
COPY --chown=app:app . /app

# collectstatic 出力先
RUN mkdir -p /app/staticfiles /app/media && chown -R app:app /app/staticfiles /app/media

USER app

EXPOSE 8000

# 起動はエントリポイントスクリプトに委譲（migrate → collectstatic → gunicorn）
COPY --chown=app:app docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://127.0.0.1:${PORT}/healthz/ || exit 1

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", \
     "--bind", "0.0.0.0:8000", \
     "--workers", "2", \
     "--threads", "2", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-"]
