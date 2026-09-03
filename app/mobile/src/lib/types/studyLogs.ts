/**
 * 勉強記録関連の型定義
 */

/** 勉強記録の型（1回の勉強の開始〜終了） */
export type StudyLog = {
  id: string; // 勉強記録ID（UUID）
  task_id: string; // 紐づく計画項目（タスク）のID
  studied_on: string; // 勉強した日付（YYYY-MM-DD 形式）
  start_time: string; // 開始時刻（HH:MM:SS 形式）
  end_time: string; // 終了時刻（HH:MM:SS 形式）
  duration_minutes: number; // 勉強分数（開始・終了から自動計算）
  memo: string; // メモ（何を勉強したか）
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
};

/** 勉強記録作成リクエストの型 */
export type CreateStudyLogRequest = {
  task_id: string; // 紐づく計画項目（タスク）のID
  studied_on: string; // 勉強した日付（YYYY-MM-DD 形式）
  start_time: string; // 開始時刻（HH:MM 形式）
  end_time: string; // 終了時刻（HH:MM 形式）
  memo?: string; // メモ（省略可）
};

/** 勉強記録の集計結果の型 */
export type StudyLogStats = {
  total_minutes: number; // 合計勉強分数
  log_count: number; // 記録件数
  hourly_minutes: number[]; // 時間帯（0〜23時）ごとの勉強分数（長さ24）
};
