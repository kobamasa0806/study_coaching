"""
ダッシュボード集計の純粋ロジック。
Django に依存しないため、DBなしで直接ユニットテストできる。
"""
from __future__ import annotations

from datetime import date, timedelta

from .models import UnitStatus


def classify_unit(
    plan_dates: list[str],
    actual_dates: list[str],
    target_date: date,
    today: date,
) -> UnitStatus:
    """
    単元（タスク）1件の計画日付・実績日付から進捗ステータスを判定する。

    Task.status フィールドは現行UIから一切操作されないため参照せず、
    日付データのみから導出する。

    - plan_dates が空                                  → UNSCHEDULED
    - 計画日をすべて実績が満たしている                  → COMPLETED
    - 未完了で、計画の終了日（plan_datesの最大値）が今日より過去 → DELAYED
    - 未完了・未遅延だが、終了日が計画全体の目標日を超えている   → POSTPONED
    - それ以外                                          → ON_TRACK
    """
    if not plan_dates:
        return UnitStatus.UNSCHEDULED

    plan_set = set(plan_dates)
    actual_set = set(actual_dates)
    end_date = date.fromisoformat(max(plan_dates))

    if plan_set <= actual_set:
        return UnitStatus.COMPLETED
    if end_date < today:
        return UnitStatus.DELAYED
    if end_date > target_date:
        return UnitStatus.POSTPONED
    return UnitStatus.ON_TRACK


def compute_streak(studied_dates: set[date], today: date) -> int:
    """
    連続学習日数を計算する。
    今日まだ記録がなくても、昨日までの連続記録があれば継続しているとみなす
    （今日と昨日のどちらにも記録がなければ 0 とする）。
    """
    cursor = today
    if cursor not in studied_dates:
        cursor = today - timedelta(days=1)
        if cursor not in studied_dates:
            return 0

    streak = 0
    while cursor in studied_dates:
        streak += 1
        cursor -= timedelta(days=1)
    return streak
