# Generated migration for line_bot app

from __future__ import annotations

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("plans", "0001_initial"),
        ("tasks", "0002_taskmodel_actual_dates_taskmodel_plan_dates_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # LINE ユーザー紐付けテーブル
        migrations.CreateModel(
            name="LineUserLinkModel",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "line_user_id",
                    models.CharField(
                        max_length=255,
                        unique=True,
                        verbose_name="LINE ユーザー ID",
                    ),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="紐付け日時"),
                ),
                (
                    "user",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="line_link",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="ユーザー",
                    ),
                ),
            ],
            options={
                "verbose_name": "LINE ユーザー紐付け",
                "verbose_name_plural": "LINE ユーザー紐付け一覧",
                "db_table": "line_user_links",
            },
        ),
        # LINE 会話状態テーブル
        migrations.CreateModel(
            name="LineConversationStateModel",
            fields=[
                (
                    "line_user_id",
                    models.CharField(
                        max_length=255,
                        primary_key=True,
                        serialize=False,
                        verbose_name="LINE ユーザー ID",
                    ),
                ),
                (
                    "state",
                    models.CharField(
                        default="idle",
                        max_length=50,
                        verbose_name="会話状態",
                    ),
                ),
                (
                    "selected_plan_id",
                    models.UUIDField(
                        blank=True,
                        null=True,
                        verbose_name="選択中の学習計画 ID",
                    ),
                ),
                (
                    "selected_task_id",
                    models.UUIDField(
                        blank=True,
                        null=True,
                        verbose_name="選択中のタスク ID",
                    ),
                ),
                (
                    "start_time",
                    models.CharField(
                        blank=True,
                        max_length=10,
                        null=True,
                        verbose_name="開始時刻",
                    ),
                ),
                (
                    "study_date",
                    models.DateField(
                        blank=True,
                        null=True,
                        verbose_name="学習日",
                    ),
                ),
                (
                    "updated_at",
                    models.DateTimeField(auto_now=True, verbose_name="更新日時"),
                ),
            ],
            options={
                "verbose_name": "LINE 会話状態",
                "verbose_name_plural": "LINE 会話状態一覧",
                "db_table": "line_conversation_states",
            },
        ),
        # 学習記録テーブル
        migrations.CreateModel(
            name="StudyRecordModel",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                (
                    "line_user_id",
                    models.CharField(
                        db_index=True,
                        max_length=255,
                        verbose_name="LINE ユーザー ID",
                    ),
                ),
                (
                    "study_date",
                    models.DateField(verbose_name="学習日"),
                ),
                (
                    "start_time",
                    models.TimeField(verbose_name="開始時刻"),
                ),
                (
                    "end_time",
                    models.TimeField(verbose_name="終了時刻"),
                ),
                (
                    "duration_minutes",
                    models.PositiveIntegerField(verbose_name="学習時間（分）"),
                ),
                (
                    "responded_at",
                    models.DateTimeField(verbose_name="回答日時"),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="作成日時"),
                ),
                (
                    "plan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="study_records",
                        to="plans.planmodel",
                        verbose_name="学習計画",
                    ),
                ),
                (
                    "task",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="study_records",
                        to="tasks.taskmodel",
                        verbose_name="タスク",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="study_records",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="ユーザー",
                    ),
                ),
            ],
            options={
                "verbose_name": "学習記録",
                "verbose_name_plural": "学習記録一覧",
                "db_table": "study_records",
                "ordering": ["-study_date", "-start_time"],
            },
        ),
        # LINE 紐付けコードテーブル
        migrations.CreateModel(
            name="LinkCodeModel",
            fields=[
                (
                    "code",
                    models.CharField(
                        max_length=8,
                        primary_key=True,
                        serialize=False,
                        verbose_name="紐付けコード",
                    ),
                ),
                (
                    "expires_at",
                    models.DateTimeField(verbose_name="有効期限"),
                ),
                (
                    "created_at",
                    models.DateTimeField(auto_now_add=True, verbose_name="作成日時"),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="link_codes",
                        to=settings.AUTH_USER_MODEL,
                        verbose_name="ユーザー",
                    ),
                ),
            ],
            options={
                "verbose_name": "LINE 紐付けコード",
                "verbose_name_plural": "LINE 紐付けコード一覧",
                "db_table": "line_link_codes",
            },
        ),
    ]
