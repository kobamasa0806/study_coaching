"""
Django 基本設定。
全環境共通の設定をここに記述する。
"""
from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from decouple import config

# プロジェクトルート: app/backend/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# セキュリティ設定
SECRET_KEY = config("SECRET_KEY")
ALLOWED_HOSTS: list[str] = config(
    "ALLOWED_HOSTS", default="localhost,127.0.0.1"
).split(",")

# アプリケーション定義
DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.users",
    "apps.plans",
    "apps.tasks",
    "apps.sessions",
    "apps.admin_panel",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# データベース設定（PostgreSQL）
# DB_SSLMODE: 本番では "require"、開発では "prefer"（デフォルト）に設定する
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": config("DB_NAME"),
        "USER": config("DB_USER"),
        "PASSWORD": config("DB_PASSWORD"),
        "HOST": config("DB_HOST", default="localhost"),
        "PORT": config("DB_PORT", default="5432"),
        "OPTIONS": {
            "sslmode": config("DB_SSLMODE", default="prefer"),
        },
    }
}

# カスタムユーザーモデル
AUTH_USER_MODEL = "users.UserModel"

# パスワードバリデーション
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# AWS Cognito 設定
AWS_COGNITO_REGION: str = config("AWS_COGNITO_REGION", default="ap-northeast-1")
AWS_COGNITO_USER_POOL_ID: str = config("AWS_COGNITO_USER_POOL_ID", default="")
AWS_COGNITO_APP_CLIENT_ID: str = config("AWS_COGNITO_APP_CLIENT_ID", default="")

# Django REST Framework 設定
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "apps.users.infrastructure.cognito_auth.CognitoJWTAuthentication",
        # 管理画面用に simplejwt も残す
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    # レート制限: 未認証 20回/分、認証済み 100回/分
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": "20/minute",
        "user": "100/minute",
    },
}

# JWT 設定
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# CORS 設定（ホワイトスペースを除去して設定ミスを防ぐ）
CORS_ALLOWED_ORIGINS: list[str] = [
    origin.strip()
    for origin in config(
        "CORS_ALLOWED_ORIGINS", default="http://localhost:3000"
    ).split(",")
    if origin.strip()
]

# セキュリティヘッダー設定
# コンテンツタイプのスニッフィングを防止する
SECURE_CONTENT_TYPE_NOSNIFF = True
# クリックジャッキング攻撃を防止する
X_FRAME_OPTIONS = "DENY"
# リファラーポリシーを制限する
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
# Content Security Policy は開発段階のためレポートのみ（本番では enforce に変更する）
# SECURE_SSL_REDIRECT・SESSION_COOKIE_SECURE・CSRF_COOKIE_SECURE は production.py で設定する

# 国際化設定
LANGUAGE_CODE = "ja"
TIME_ZONE = "Asia/Tokyo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
