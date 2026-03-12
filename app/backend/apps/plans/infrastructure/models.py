"""
学習計画の Django ORM モデル。
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class PlanModel(models.Model):
    """学習計画 ORM モデル。"""

    class Status(models.TextChoices):
        ACTIVE = "active", "進行中"
        COMPLETED = "completed", "完了"
        ARCHIVED = "archived", "アーカイブ"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="plans",
        verbose_name="ユーザー",
    )
    title = models.CharField(max_length=255, verbose_name="タイトル")
    description = models.TextField(blank=True, default="", verbose_name="説明")
    target_date = models.DateField(verbose_name="目標日")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="ステータス",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        db_table = "plans"
        verbose_name = "学習計画"
        verbose_name_plural = "学習計画一覧"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title
