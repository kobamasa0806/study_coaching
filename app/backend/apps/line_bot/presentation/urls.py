"""
LINE Bot の URL ルーティング。
"""
from __future__ import annotations

from django.urls import path

from .views import GenerateLinkCodeView, LineWebhookView, StudyRecordListView

urlpatterns = [
    # LINE プラットフォームからの Webhook エンドポイント
    path("webhook/", LineWebhookView.as_view(), name="line-webhook"),
    # Web ユーザー向け: LINE 紐付けコード発行
    path("link-code/", GenerateLinkCodeView.as_view(), name="line-link-code"),
    # Web ユーザー向け: 学習記録一覧
    path("study-records/", StudyRecordListView.as_view(), name="study-records"),
]
