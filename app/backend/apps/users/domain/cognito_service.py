"""
Cognito サービスの抽象インターフェース。
infrastructure 層で具体実装を行う。
"""
from __future__ import annotations

from abc import ABC, abstractmethod


class AbstractCognitoService(ABC):
    """AWS Cognito User Pool 操作の抽象基底クラス。"""

    @abstractmethod
    def create_user(self, email: str, password: str, username: str) -> str:
        """
        Cognito User Pool に新規ユーザーを作成し、sub（Cognito ユーザー ID）を返す。
        同一メールアドレスが既に存在する場合は ValueError を送出する。
        """
        ...

    @abstractmethod
    def delete_user(self, email: str) -> None:
        """Cognito User Pool からユーザーを削除する（登録失敗時のロールバック用）。"""
        ...
