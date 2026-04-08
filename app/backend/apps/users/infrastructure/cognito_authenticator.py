"""
Cognito JWT 検証カスタム認証クラス。
DRF の認証バックエンドとして機能し、Cognito アクセストークンを検証する。
"""
from __future__ import annotations

import time
from typing import Any

import requests
from django.conf import settings
from jose import JWTError, jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.request import Request

from .models import UserModel

# JWKS をプロセス内でキャッシュする（TTL: 1時間）
_jwks_cache: dict[str, Any] | None = None
_jwks_cache_time: float = 0.0
_JWKS_CACHE_TTL: int = 3600


def _get_jwks() -> dict[str, Any]:
    """Cognito の JWKS（公開鍵セット）を取得する。キャッシュが有効な場合はキャッシュを返す。"""
    global _jwks_cache, _jwks_cache_time
    now = time.time()
    if _jwks_cache is None or (now - _jwks_cache_time) > _JWKS_CACHE_TTL:
        region = settings.COGNITO_REGION
        pool_id = settings.COGNITO_USER_POOL_ID
        url = (
            f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"
            "/.well-known/jwks.json"
        )
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        _jwks_cache = response.json()
        _jwks_cache_time = now
    return _jwks_cache  # type: ignore[return-value]


class CognitoJWTAuthentication(BaseAuthentication):
    """
    Cognito アクセストークンを検証する DRF 認証クラス。

    フロントエンドから送られた Bearer トークンを Cognito の公開鍵で検証し、
    対応するローカルユーザーを返す。
    """

    def authenticate(self, request: Request) -> tuple[UserModel, str] | None:
        """
        Authorization ヘッダーから Bearer トークンを取得して検証する。
        トークンがない場合は None を返し、他の認証クラスに処理を委ねる。
        """
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if not auth_header.startswith("Bearer "):
            return None

        token = auth_header.split(" ", 1)[1].strip()
        if not token:
            return None

        claims = self._verify_token(token)
        user = self._get_user(claims)
        return (user, token)

    def _verify_token(self, token: str) -> dict[str, Any]:
        """JWT のヘッダー・署名・有効期限・クレームを検証し、ペイロードを返す。"""
        # ヘッダーをデコードして kid（鍵 ID）を取得する
        try:
            headers = jwt.get_unverified_headers(token)
        except JWTError as e:
            raise AuthenticationFailed("無効なトークン形式です。") from e

        kid = headers.get("kid")
        if not kid:
            raise AuthenticationFailed("kid クレームが見つかりません。")

        # JWKS から対応する公開鍵を取得する
        try:
            jwks = _get_jwks()
        except Exception as e:
            raise AuthenticationFailed("Cognito 公開鍵の取得に失敗しました。") from e

        key_data = next(
            (k for k in jwks.get("keys", []) if k.get("kid") == kid),
            None,
        )
        if key_data is None:
            raise AuthenticationFailed("対応する公開鍵が見つかりません。")

        # トークンの署名・発行者・有効期限を検証する
        region = settings.COGNITO_REGION
        pool_id = settings.COGNITO_USER_POOL_ID
        issuer = f"https://cognito-idp.{region}.amazonaws.com/{pool_id}"

        try:
            claims: dict[str, Any] = jwt.decode(
                token,
                key_data,
                algorithms=["RS256"],
                issuer=issuer,
                options={"verify_at_hash": False},
            )
        except JWTError as e:
            raise AuthenticationFailed(f"トークン検証に失敗しました: {e}") from e

        # token_use クレームを確認する（access または id トークンのみ受け付ける）
        if claims.get("token_use") not in ("access", "id"):
            raise AuthenticationFailed("無効な token_use クレームです。")

        return claims

    def _get_user(self, claims: dict[str, Any]) -> UserModel:
        """Cognito sub クレームからローカルユーザーを取得する。"""
        cognito_sub = claims.get("sub")
        if not cognito_sub:
            raise AuthenticationFailed("sub クレームが見つかりません。")

        try:
            return UserModel.objects.get(cognito_sub=cognito_sub)
        except UserModel.DoesNotExist:
            pass

        # cognito_sub が未設定の場合はメールアドレスで検索してリンクする（移行期の互換性）
        email = claims.get("email") or claims.get("username", "")
        if email:
            try:
                user = UserModel.objects.get(email=email)
                user.cognito_sub = cognito_sub
                user.save(update_fields=["cognito_sub"])
                return user
            except UserModel.DoesNotExist:
                pass

        raise AuthenticationFailed(
            "ユーザーが見つかりません。先にアカウント登録を行ってください。"
        )
