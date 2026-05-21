"""
お問い合わせ API のシリアライザー。
"""
from __future__ import annotations

from rest_framework import serializers


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField(max_length=5000)
