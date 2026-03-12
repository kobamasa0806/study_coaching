"""
ユーザーの Django ORM モデル。
カスタムユーザーモデルとして AbstractBaseUser を継承する。
"""
from __future__ import annotations

import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserModelManager(BaseUserManager["UserModel"]):
    """カスタムユーザーマネージャー。"""

    def create_user(
        self,
        email: str,
        username: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> "UserModel":
        """通常ユーザーを作成する。"""
        if not email:
            raise ValueError("メールアドレスは必須です。")
        email = self.normalize_email(email)
        user: UserModel = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(
        self,
        email: str,
        username: str,
        password: str | None = None,
        **extra_fields: object,
    ) -> "UserModel":
        """スーパーユーザーを作成する。"""
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, username, password, **extra_fields)


class UserModel(AbstractBaseUser, PermissionsMixin):
    """カスタムユーザーモデル。認証にメールアドレスを使用する。"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, verbose_name="メールアドレス")
    username = models.CharField(max_length=150, verbose_name="ユーザー名")
    is_active = models.BooleanField(default=True, verbose_name="有効")
    is_staff = models.BooleanField(default=False, verbose_name="スタッフ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")

    objects = UserModelManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        verbose_name = "ユーザー"
        verbose_name_plural = "ユーザー一覧"

    def __str__(self) -> str:
        return self.email
