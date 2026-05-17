"""
Cognito ユーザープールの管理操作サービス。
AdminCreateUser / AdminAddUserToGroup など管理者専用 API を担当する。
"""
from __future__ import annotations

import logging

import boto3
from botocore.exceptions import ClientError
from django.conf import settings

from apps.users.application.use_cases import AbstractCognitoAdminService

logger = logging.getLogger(__name__)


class CoachCreationError(Exception):
    """コーチ作成失敗を示す例外。"""


class CognitoAdminService(AbstractCognitoAdminService):
    """boto3 を使用した Cognito 管理操作の実装。"""

    def __init__(self) -> None:
        self._client = boto3.client(
            "cognito-idp",
            region_name=settings.AWS_COGNITO_REGION,
        )
        self._user_pool_id = settings.AWS_COGNITO_USER_POOL_ID

    def create_coach(self, email: str) -> None:
        """
        コーチアカウントを Cognito に作成し、coaches グループに追加する。
        仮パスワードはメールで自動送信される。
        """
        self._create_cognito_user(email)
        self._add_to_coaches_group(email)

    def _create_cognito_user(self, email: str) -> None:
        try:
            self._client.admin_create_user(
                UserPoolId=self._user_pool_id,
                Username=email,
                UserAttributes=[
                    {"Name": "email", "Value": email},
                    {"Name": "email_verified", "Value": "true"},
                ],
                DesiredDeliveryMediums=["EMAIL"],
            )
        except ClientError as e:
            error_code = e.response["Error"]["Code"]
            if error_code == "UsernameExistsException":
                raise CoachCreationError(
                    "このメールアドレスは既に Cognito に登録されています。"
                ) from e
            logger.error("Cognito ユーザー作成に失敗しました: email=%s error=%s", email, e)
            raise CoachCreationError("コーチアカウントの作成に失敗しました。") from e

    def _add_to_coaches_group(self, email: str) -> None:
        try:
            self._client.admin_add_user_to_group(
                UserPoolId=self._user_pool_id,
                Username=email,
                GroupName="coaches",
            )
        except ClientError as e:
            logger.error(
                "coaches グループへの追加に失敗しました: email=%s error=%s", email, e
            )
            raise CoachCreationError("coaches グループへの追加に失敗しました。") from e
