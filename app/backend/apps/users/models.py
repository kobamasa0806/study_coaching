# Django がモデルを検出するためのエントリーポイント。
# 実装は infrastructure 層に置き、ここで再エクスポートする。
from .infrastructure.models import UserModel

__all__ = ["UserModel"]
