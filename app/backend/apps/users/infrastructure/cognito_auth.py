"""
AWS Cognito JWT 認証クラス。
DRF の認証バックエンドとして、Cognito が発行した id_token を検証する。
検証成功時にユーザーが存在しなければ自動作成する（初回ログイン対応）。
"""
from __future__ import annotations

import logging
import time
from typing import Any

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email
from jose import ExpiredSignatureError, JWTError, jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

logger = logging.getLogger(__name__)

User = get_user_model()

# JWKS キャッシュ（TTL: 1時間。公開鍵ローテーションに対応するため定期的にリフレッシュする）
_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: float = 0.0
_JWKS_CACHE_TTL_SEC: float = 3600.0


def _get_jwks() -> dict[str, Any]:
    """Cognito の JWKS エンドポイントから公開鍵セットを取得する（TTL 付きキャッシュ）。"""
    global _jwks_cache, _jwks_cache_time
    now = time.monotonic()
    if _jwks_cache is not None and (now - _jwks_cache_time) < _JWKS_CACHE_TTL_SEC:
        return _jwks_cache

    region = settings.AWS_COGNITO_REGION
    user_pool_id = settings.AWS_COGNITO_USER_POOL_ID
    url = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}/.well-known/jwks.json"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now
        return _jwks_cache
    except requests.RequestException as e:
        logger.error("JWKS の取得に失敗しました: %s", e)
        raise AuthenticationFailed("認証サーバーへの接続に失敗しました。") from e


def _verify_token(id_token: str) -> dict[str, Any]:
    """
    Cognito id_token を検証してクレームを返す。
    署名・有効期限・issuer・audience を検証する。
    """
    region = settings.AWS_COGNITO_REGION
    user_pool_id = settings.AWS_COGNITO_USER_POOL_ID
    client_id = settings.AWS_COGNITO_APP_CLIENT_ID
    issuer = f"https://cognito-idp.{region}.amazonaws.com/{user_pool_id}"

    try:
        jwks = _get_jwks()
        claims = jwt.decode(
            id_token,
            jwks,
            algorithms=["RS256"],
            audience=client_id,
            issuer=issuer,
        )
        return claims
    except ExpiredSignatureError as e:
        raise AuthenticationFailed("トークンの有効期限が切れています。") from e
    except JWTError as e:
        raise AuthenticationFailed("無効なトークンです。") from e


def _get_or_create_user(claims: dict[str, Any]) -> Any:
    """
    Cognito クレームからユーザーを取得または作成する。
    email を一意キーとして使用する。
    cognito:groups に "coaches" が含まれる場合は is_staff=True を設定する（毎回同期）。
    """
    email: str = claims.get("email", "")
    cognito_sub: str = claims.get("sub", "")
    name: str = (
        claims.get("name", "")
        or claims.get("cognito:username", "")
        or email.split("@")[0]
    )

    if not email or not cognito_sub:
        raise AuthenticationFailed("トークンに必要なクレームが含まれていません。")

    # Cognito クレームのメールアドレス形式を検証する（なりすまし対策）
    try:
        validate_email(email)
    except DjangoValidationError:
        raise AuthenticationFailed("トークンに含まれるメールアドレスが無効です。")

    # coaches グループへの所属を is_staff に反映する
    groups: list[str] = claims.get("cognito:groups") or []
    is_coach = "coaches" in groups

    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "username": name[:150],
            "is_active": True,
            "is_staff": is_coach,
        },
    )

    if created:
        logger.info("Cognito 経由で新規ユーザーを作成しました: %s", email)
        # パスワード認証は使用しないため、使用不能なパスワードを設定する
        user.set_unusable_password()
        user.save(update_fields=["password"])
    elif user.is_staff != is_coach:
        # Cognito グループの変更を Django 側に同期する
        user.is_staff = is_coach
        user.save(update_fields=["is_staff"])

    return user


class CognitoJWTAuthentication(BaseAuthentication):
    """
    Authorization: Bearer <id_token> ヘッダーから Cognito id_token を取得して検証する。
    """

    def authenticate(self, request: Request) -> tuple[Any, str] | None:
        auth_header: str = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return None

        id_token = auth_header.split(" ", 1)[1]
        if not id_token:
            return None

        claims = _verify_token(id_token)
        user = _get_or_create_user(claims)
        return (user, id_token)

    def authenticate_header(self, request: Request) -> str:
        return "Bearer realm='Cognito'"
