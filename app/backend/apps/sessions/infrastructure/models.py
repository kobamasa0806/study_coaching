"""
セッションの Django ORM モデル。
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class SessionModel(models.Model):
    """1on1 セッション ORM モデル。"""

    class Status(models.TextChoices):
        SCHEDULED = "scheduled", "予定済み"
        COMPLETED = "completed", "完了"
        CANCELLED = "cancelled", "キャンセル"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sessions",
        verbose_name="ユーザー",
    )
    scheduled_at = models.DateTimeField(verbose_name="予定日時")
    memo = models.TextField(blank=True, default="", verbose_name="事前メモ")
    summary = models.TextField(blank=True, default="", verbose_name="セッションまとめ")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
        verbose_name="ステータス",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        db_table = "sessions"
        verbose_name = "セッション"
        verbose_name_plural = "セッション一覧"
        ordering = ["-scheduled_at"]

    def __str__(self) -> str:
        return f"{self.user} - {self.scheduled_at:%Y-%m-%d %H:%M}"
