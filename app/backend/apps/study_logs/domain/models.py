"""
勉強記録ドメインモデル。
Django・DRF に一切依存しない純粋な Python クラスで定義する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, time
from uuid import UUID

# 1日の分数。日跨ぎの計算で使う。
MINUTES_PER_DAY = 24 * 60


def _to_minutes(t: time) -> int:
    """時刻を「0時からの経過分数」に変換する。"""
    return t.hour * 60 + t.minute


@dataclass
class StudyLog:
    """勉強記録エンティティ。1回の勉強（開始〜終了）を表す。"""

    id: UUID
    user_id: UUID
    task_id: UUID
    studied_on: date  # 勉強した日付
    start_time: time  # 開始時刻
    end_time: time    # 終了時刻
    memo: str
    created_at: datetime
    updated_at: datetime

    @property
    def duration_minutes(self) -> int:
        """
        勉強した分数を開始・終了時刻から自動計算する。
        終了が開始以前の場合は日付を跨いだものとして翌日扱いにする。
        """
        start = _to_minutes(self.start_time)
        end = _to_minutes(self.end_time)
        if end <= start:
            end += MINUTES_PER_DAY  # 日跨ぎ（例: 23:00〜翌1:00）
        return end - start

    def hourly_distribution(self) -> list[int]:
        """
        この記録の勉強分数を時間帯（0〜23時）ごとに振り分けて返す。
        例: 14:30〜16:00 → 14時に30分・15時に60分。
        返り値は長さ24の整数リスト（各要素がその時間帯の分数）。
        """
        hourly = [0] * 24
        start = _to_minutes(self.start_time)
        end = start + self.duration_minutes
        for minute in range(start, end):
            hourly[(minute // 60) % 24] += 1
        return hourly
