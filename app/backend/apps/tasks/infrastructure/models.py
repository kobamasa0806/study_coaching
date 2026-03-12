"""
タスクの Django ORM モデル。
"""
from __future__ import annotations

import uuid

from django.db import models


class TaskModel(models.Model):
    """タスク ORM モデル（ガントチャートの各要素）。"""

    class Status(models.TextChoices):
        PENDING = "pending", "未着手"
        IN_PROGRESS = "in_progress", "進行中"
        COMPLETED = "completed", "完了"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(
        "plans.PlanModel",
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="学習計画",
    )
    title = models.CharField(max_length=255, verbose_name="タイトル")
    description = models.TextField(blank=True, default="", verbose_name="説明")
    start_date = models.DateField(null=True, blank=True, verbose_name="開始日")
    end_date = models.DateField(null=True, blank=True, verbose_name="終了日")
    # ガントチャート用：計画・実績の個別日付を保持する
    plan_dates = models.JSONField(default=list, verbose_name="計画日付リスト")
    actual_dates = models.JSONField(default=list, verbose_name="実績日付リスト")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name="ステータス",
    )
    order = models.PositiveIntegerField(default=1, verbose_name="表示順")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        db_table = "tasks"
        verbose_name = "タスク"
        verbose_name_plural = "タスク一覧"
        ordering = ["order", "start_date"]

    def __str__(self) -> str:
        return self.title
