"""
LINE Bot の Django ORM モデル。
"""
from __future__ import annotations

import uuid

from django.conf import settings
from django.db import models


class LineUserLinkModel(models.Model):
    """LINE ユーザーと Django ユーザーの紐付け ORM モデル。"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="line_link",
        verbose_name="ユーザー",
    )
    line_user_id = models.CharField(
        max_length=255,
        unique=True,
        verbose_name="LINE ユーザー ID",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="紐付け日時")

    class Meta:
        db_table = "line_user_links"
        verbose_name = "LINE ユーザー紐付け"
        verbose_name_plural = "LINE ユーザー紐付け一覧"

    def __str__(self) -> str:
        return f"{self.user} - {self.line_user_id}"


class LineConversationStateModel(models.Model):
    """LINE 会話の状態を保持する ORM モデル。line_user_id を主キーとする。"""

    line_user_id = models.CharField(
        max_length=255,
        primary_key=True,
        verbose_name="LINE ユーザー ID",
    )
    state = models.CharField(
        max_length=50,
        default="idle",
        verbose_name="会話状態",
    )
    selected_plan_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name="選択中の学習計画 ID",
    )
    selected_task_id = models.UUIDField(
        null=True,
        blank=True,
        verbose_name="選択中のタスク ID",
    )
    # 開始時刻（"HH:MM" 形式で保存）
    start_time = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        verbose_name="開始時刻",
    )
    study_date = models.DateField(
        null=True,
        blank=True,
        verbose_name="学習日",
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新日時")

    class Meta:
        db_table = "line_conversation_states"
        verbose_name = "LINE 会話状態"
        verbose_name_plural = "LINE 会話状態一覧"

    def __str__(self) -> str:
        return f"{self.line_user_id} - {self.state}"


class StudyRecordModel(models.Model):
    """LINE Bot 経由で記録された学習記録 ORM モデル。"""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    line_user_id = models.CharField(
        max_length=255,
        verbose_name="LINE ユーザー ID",
        db_index=True,
    )
    # LINE アカウントと紐付けされた場合のみ設定される
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="study_records",
        verbose_name="ユーザー",
    )
    plan = models.ForeignKey(
        "plans.PlanModel",
        on_delete=models.CASCADE,
        related_name="study_records",
        verbose_name="学習計画",
    )
    task = models.ForeignKey(
        "tasks.TaskModel",
        on_delete=models.CASCADE,
        related_name="study_records",
        verbose_name="タスク",
    )
    study_date = models.DateField(verbose_name="学習日")
    start_time = models.TimeField(verbose_name="開始時刻")
    end_time = models.TimeField(verbose_name="終了時刻")
    # 開始〜終了から計算した学習時間（分）
    duration_minutes = models.PositiveIntegerField(verbose_name="学習時間（分）")
    # LINE Webhook を受信した日時（ユーザーの回答時刻に相当）
    responded_at = models.DateTimeField(verbose_name="回答日時")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")

    class Meta:
        db_table = "study_records"
        verbose_name = "学習記録"
        verbose_name_plural = "学習記録一覧"
        ordering = ["-study_date", "-start_time"]

    def __str__(self) -> str:
        return f"{self.line_user_id} - {self.study_date} {self.start_time}〜{self.end_time}"


class LinkCodeModel(models.Model):
    """LINE アカウント紐付け用の一時コード ORM モデル。"""

    code = models.CharField(
        max_length=8,
        primary_key=True,
        verbose_name="紐付けコード",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="link_codes",
        verbose_name="ユーザー",
    )
    expires_at = models.DateTimeField(verbose_name="有効期限")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="作成日時")

    class Meta:
        db_table = "line_link_codes"
        verbose_name = "LINE 紐付けコード"
        verbose_name_plural = "LINE 紐付けコード一覧"

    def __str__(self) -> str:
        return f"{self.code} - {self.user}"
