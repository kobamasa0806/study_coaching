"""
勉強記録関連のユースケース。
ビジネスロジック（勉強分数の集計など）をここに集約する。
"""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, time
from uuid import UUID

from ..domain.models import StudyLog
from ..domain.repositories import AbstractStudyLogRepository


@dataclass
class CreateStudyLogCommand:
    """勉強記録作成コマンド。"""

    user_id: UUID
    plan_id: UUID
    task_id: UUID
    studied_on: date
    start_time: time
    end_time: time
    memo: str


@dataclass
class StudyLogStats:
    """勉強記録の集計結果。"""

    total_minutes: int       # 合計勉強分数
    log_count: int           # 記録件数
    hourly_minutes: list[int]  # 時間帯（0〜23時）ごとの勉強分数（長さ24）


class CreateStudyLogUseCase:
    """勉強記録作成ユースケース。"""

    def __init__(self, study_log_repository: AbstractStudyLogRepository) -> None:
        self._study_log_repository = study_log_repository

    def execute(self, command: CreateStudyLogCommand) -> StudyLog:
        """
        新規勉強記録を作成する。
        指定タスクが計画に属さない場合・開始終了が同時刻の場合は例外を送出する。
        """
        if not self._study_log_repository.task_belongs_to_plan(
            command.task_id, command.plan_id
        ):
            raise ValueError("指定した項目がこの計画に存在しません。")
        if command.start_time == command.end_time:
            raise ValueError("開始時刻と終了時刻が同じです。")

        return self._study_log_repository.create(
            user_id=command.user_id,
            task_id=command.task_id,
            studied_on=command.studied_on,
            start_time=command.start_time,
            end_time=command.end_time,
            memo=command.memo,
        )


class ListStudyLogsUseCase:
    """勉強記録一覧取得ユースケース。"""

    def __init__(self, study_log_repository: AbstractStudyLogRepository) -> None:
        self._study_log_repository = study_log_repository

    def execute(self, plan_id: UUID) -> list[StudyLog]:
        """計画に紐づく勉強記録一覧を返す。"""
        return self._study_log_repository.find_by_plan_id(plan_id)


class DeleteStudyLogUseCase:
    """勉強記録削除ユースケース。"""

    def __init__(self, study_log_repository: AbstractStudyLogRepository) -> None:
        self._study_log_repository = study_log_repository

    def execute(self, log_id: UUID, plan_id: UUID) -> None:
        """
        勉強記録を削除する。
        存在しない場合・指定計画に属さない場合は例外を送出する。
        """
        log = self._study_log_repository.find_by_id(log_id)
        if log is None:
            raise ValueError("勉強記録が見つかりません。")
        if not self._study_log_repository.task_belongs_to_plan(log.task_id, plan_id):
            # 別計画の記録を消そうとした場合は存在しない扱いにする
            raise ValueError("勉強記録が見つかりません。")

        self._study_log_repository.delete(log_id)


class GetStudyLogStatsUseCase:
    """勉強記録の集計ユースケース（合計時間・時間帯別分布）。"""

    def __init__(self, study_log_repository: AbstractStudyLogRepository) -> None:
        self._study_log_repository = study_log_repository

    def execute(self, plan_id: UUID) -> StudyLogStats:
        """
        計画の全勉強記録から合計分数と時間帯別の分数を集計する。
        """
        logs = self._study_log_repository.find_by_plan_id(plan_id)

        total_minutes = 0
        hourly_minutes = [0] * 24
        for log in logs:
            total_minutes += log.duration_minutes
            for hour, minutes in enumerate(log.hourly_distribution()):
                hourly_minutes[hour] += minutes

        return StudyLogStats(
            total_minutes=total_minutes,
            log_count=len(logs),
            hourly_minutes=hourly_minutes,
        )
