/**
 * ダッシュボード集計関連の型定義
 * バックエンドの apps/dashboard が返す形式に対応する。
 */

/** 単元（タスク）の進捗ステータス */
export type UnitStatus = "completed" | "delayed" | "postponed" | "on_track" | "unscheduled";

/** ホーム画面向けのサマリー */
export type DashboardSummary = {
  progress_percent: number; // 計画全体の進捗率（0〜100）
  today_study_minutes: number; // 今日の学習時間（分）
  streak_days: number; // 連続学習日数
};

/** 単元ごとの計画vs実績 */
export type UnitProgress = {
  task_id: string;
  title: string;
  status: UnitStatus;
  planned_days: number; // 計画日数
  studied_days: number; // 計画日のうち実績があった日数
  extra_days: number; // 計画外に学習した日数
  completion_rate: number; // studied_days / planned_days（0〜1）
};

/** 計画画面向けの計画vs実績サマリー */
export type PlanVsActual = {
  total_planned_days: number;
  total_studied_days: number;
  completion_rate: number;
  completed_count: number;
  delayed_count: number;
  postponed_count: number;
  on_track_count: number;
  unscheduled_count: number;
  units: UnitProgress[];
};
