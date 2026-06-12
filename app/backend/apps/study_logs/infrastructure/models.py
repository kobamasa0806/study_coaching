"""
勉強記録の Django ORM モデル。
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class StudyLogModel(models.Model):
    """勉強記録 ORM モデル（1回の勉強の開始〜終了）。"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="study_logs",
        verbose_name="ユーザー",
    )
    task = models.ForeignKey(
        "tasks.TaskModel",
        on_delete=models.CASCADE,
        related_name="study_logs",
        verbose_name="計画項目",
    )
    studied_on = models.DateField(verbose_name="勉強日")
    start_time = models.TimeField(verbose_name="開始時刻")
    end_time = models.TimeField(verbose_name="終了時刻")
    memo = models.TextField(blank=True, default="", verbose_name="メモ")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        db_table = "study_logs"
        verbose_name = "勉強記録"
        verbose_name_plural = "勉強記録一覧"
        ordering = ["-studied_on", "-start_time"]

    def __str__(self) -> str:
        return f"{self.user} - {self.studied_on} {self.start_time:%H:%M}〜{self.end_time:%H:%M}"
