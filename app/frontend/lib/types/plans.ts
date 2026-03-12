/**
 * 学習計画・タスク関連の型定義
 */

/**
 * 学習計画のステータス
 *   active    = 進行中
 *   completed = 完了
 *   archived  = アーカイブ（非表示）
 */
export type PlanStatus = "active" | "completed" | "archived";

/**
 * タスクのステータス
 *   pending     = 未着手
 *   in_progress = 進行中
 *   completed   = 完了
 */
export type TaskStatus = "pending" | "in_progress" | "completed";

/** 学習計画の型 */
export type Plan = {
  id: string;          // プランID（UUID）
  user_id: string;     // 所有ユーザーのID
  title: string;       // タイトル
  description: string; // 説明
  target_date: string; // 目標日（YYYY-MM-DD 形式）
  status: PlanStatus;  // ステータス
  created_at: string;  // 作成日時
  updated_at: string;  // 更新日時
};

/** タスクの型（ガントチャートの各行に対応） */
export type Task = {
  id: string;              // タスクID（UUID）
  plan_id: string;         // 所属する学習計画のID
  title: string;           // タイトル
  description: string;     // 説明
  plan_dates: string[];    // 計画日付リスト（"YYYY-MM-DD" 形式の配列）
  actual_dates: string[];  // 実績日付リスト（"YYYY-MM-DD" 形式の配列）
  start_date: string | null; // 開始日（plan_dates の最小値から自動導出）
  end_date: string | null;   // 終了日（plan_dates の最大値から自動導出）
  status: TaskStatus;      // ステータス
  order: number;           // 表示順（小さいほど上に表示）
  created_at: string;      // 作成日時
  updated_at: string;      // 更新日時
};

/** 学習計画作成リクエストの型 */
export type CreatePlanRequest = {
  title: string;        // タイトル
  description: string;  // 説明
  target_date: string;  // 目標日（YYYY-MM-DD 形式）
};

/** 学習計画更新リクエストの型 */
export type UpdatePlanRequest = {
  title: string;        // タイトル
  description: string;  // 説明
  target_date: string;  // 目標日
  status: PlanStatus;   // ステータス
};

/** タスク作成リクエストの型 */
export type CreateTaskRequest = {
  title: string;           // タイトル
  description?: string;    // 説明（省略可）
  plan_dates?: string[];   // 計画日付リスト（省略可）
  actual_dates?: string[]; // 実績日付リスト（省略可）
};

/** タスク更新リクエストの型 */
export type UpdateTaskRequest = {
  title: string;           // タイトル
  description?: string;    // 説明
  plan_dates: string[];    // 計画日付リスト
  actual_dates: string[];  // 実績日付リスト
  status: TaskStatus;      // ステータス
  order: number;           // 表示順
};
