"""
ダッシュボード集計の純粋ロジック（domain/services.py）の単体テスト。
Django・DBに依存しない。
"""
from __future__ import annotations

from datetime import date

from apps.dashboard.domain.models import UnitStatus
from apps.dashboard.domain.services import classify_unit, compute_streak


class TestClassifyUnit:
    """classify_unit のテスト。"""

    def test_plan_datesが空ならUNSCHEDULED(self):
        """plan_dates が空の場合、UNSCHEDULED になること。"""
        result = classify_unit([], [], target_date=date(2026, 6, 30), today=date(2026, 1, 1))
        assert result == UnitStatus.UNSCHEDULED

    def test_計画日をすべて実績が満たせばCOMPLETED(self):
        """plan_dates のすべてが actual_dates に含まれる場合、COMPLETED になること。"""
        result = classify_unit(
            plan_dates=["2026-01-01", "2026-01-02"],
            actual_dates=["2026-01-01", "2026-01-02", "2026-01-03"],
            target_date=date(2026, 6, 30),
            today=date(2026, 1, 5),
        )
        assert result == UnitStatus.COMPLETED

    def test_未完了かつ終了日が今日より過去ならDELAYED(self):
        """未完了で end_date が today より前の場合、DELAYED になること。"""
        result = classify_unit(
            plan_dates=["2026-01-01", "2026-01-02"],
            actual_dates=["2026-01-01"],
            target_date=date(2026, 6, 30),
            today=date(2026, 1, 5),
        )
        assert result == UnitStatus.DELAYED

    def test_終了日が今日と同じ場合は遅れではない(self):
        """end_date == today の場合は DELAYED に分類されない（境界値）。"""
        result = classify_unit(
            plan_dates=["2026-01-01", "2026-01-05"],
            actual_dates=[],
            target_date=date(2026, 6, 30),
            today=date(2026, 1, 5),
        )
        assert result != UnitStatus.DELAYED

    def test_未完了未遅延で終了日が目標日を超えればPOSTPONED(self):
        """未完了・未遅延で end_date が plan.target_date を超えている場合、POSTPONED になること。"""
        result = classify_unit(
            plan_dates=["2026-01-01", "2026-07-01"],
            actual_dates=[],
            target_date=date(2026, 6, 30),
            today=date(2026, 1, 1),
        )
        assert result == UnitStatus.POSTPONED

    def test_終了日が目標日と同じ場合は延期ではない(self):
        """end_date == target_date の場合は POSTPONED に分類されない（境界値）。"""
        result = classify_unit(
            plan_dates=["2026-01-01", "2026-06-30"],
            actual_dates=[],
            target_date=date(2026, 6, 30),
            today=date(2026, 1, 1),
        )
        assert result != UnitStatus.POSTPONED

    def test_それ以外はON_TRACK(self):
        """未完了・未遅延・未延期の場合、ON_TRACK になること。"""
        result = classify_unit(
            plan_dates=["2026-01-01", "2026-01-10"],
            actual_dates=["2026-01-01"],
            target_date=date(2026, 6, 30),
            today=date(2026, 1, 5),
        )
        assert result == UnitStatus.ON_TRACK


class TestComputeStreak:
    """compute_streak のテスト。"""

    def test_記録が無ければ0(self):
        """studied_dates が空の場合、0 を返すこと。"""
        assert compute_streak(set(), today=date(2026, 1, 10)) == 0

    def test_今日のみ記録があれば1(self):
        """今日のみ記録がある場合、1 を返すこと。"""
        assert compute_streak({date(2026, 1, 10)}, today=date(2026, 1, 10)) == 1

    def test_昨日のみ記録があっても継続扱い(self):
        """今日の記録がなくても昨日の記録があれば継続とみなすこと。"""
        assert compute_streak({date(2026, 1, 9)}, today=date(2026, 1, 10)) == 1

    def test_今日も昨日も記録が無ければ0(self):
        """今日・昨日どちらにも記録がない場合、0 を返すこと（一昨日の記録は無視）。"""
        studied = {date(2026, 1, 8)}
        assert compute_streak(studied, today=date(2026, 1, 10)) == 0

    def test_連続した記録は日数分カウントする(self):
        """3日連続で記録がある場合、3 を返すこと。"""
        studied = {date(2026, 1, 8), date(2026, 1, 9), date(2026, 1, 10)}
        assert compute_streak(studied, today=date(2026, 1, 10)) == 3

    def test_途中に空白があれば途切れる(self):
        """途中に記録のない日がある場合、そこで連続日数が途切れること。"""
        studied = {date(2026, 1, 5), date(2026, 1, 9), date(2026, 1, 10)}
        assert compute_streak(studied, today=date(2026, 1, 10)) == 2
