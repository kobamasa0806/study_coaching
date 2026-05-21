"""
お問い合わせ URL ルーティング。
"""
from __future__ import annotations

from django.urls import path

from .views import ContactView

urlpatterns = [
    path("", ContactView.as_view(), name="contact"),
]
