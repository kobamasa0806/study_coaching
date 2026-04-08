"""
AWS Cognito サービスの infrastructure 実装。
boto3 を使って Cognito User Pool を操作する。
"""
from __future__ import annotations

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

from ..domain.cognito_service import AbstractCognitoService


class CognitoService(AbstractCognitoService):
    """AWS Cognito User Pool の操作を行うサービスクラス。"""

    def __init__(self) -> None:
        self._client = boto3.client(
            "cognito-idp",
            region_name=settings.COGNITO_REGION,
        )
        self._user_pool_id: str = settings.COGNITO_USER_POOL_ID
        self._client_id: str = settings.COGNITO_APP_CLIENT_ID

    def create_user(self, email: str, password: str, username: str) -> str:
        """
        Cognito User Pool に新規ユーザーを作成し、sub（Cognito ユーザー ID）を返す。
        admin API を使い、メール確認不要でユーザーを作成する。
        同一メールアドレスが既に存在する場合は ValueError を送出する。
        """
        try:
            # ユーザーを作成する（ウェルカムメール送信なし）
            response = self._client.admin_create_user(
                UserPoolId=self._user_pool_id,
                Username=email,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "email_verified", "Value": "true"},
                    {"Name": "preferred_username", "Value": username},
                ],
                MessageAction="SUPPRESS",
            )
            user = response["User"]

            # パスワードを永続的に設定する（FORCE_CHANGE_PASSWORD ステータスを回避）
            self._client.admin_set_user_password(
                UserPoolId=self._user_pool_id,
                Username=email,
                Password=password,
                Permanent=True,
            )

            # sub（Cognito ユーザー固有 ID）を取得して返す
            sub = next(
                attr["Value"]
                for attr in user["Attributes"]
                if attr["Name"] == "sub"
            )
            return sub

        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "UsernameExistsException":
                raise ValueError("このメールアドレスは既に Cognito に登録されています。") from e
            raise

    def delete_user(self, email: str) -> None:
        """
        Cognito User Pool からユーザーを削除する。
        登録処理途中でのロールバック用途で使用する。
        """
        try:
            self._client.admin_delete_user(
                UserPoolId=self._user_pool_id,
                Username=email,
            )
        except ClientError:
            # 削除失敗はロールバック処理のため無視する
            pass
