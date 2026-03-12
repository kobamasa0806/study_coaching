/**
 * 1on1 セッション関連の型定義
 */

/**
 * セッションのステータス
 *   scheduled  = 予定済み
 *   completed  = 完了
 *   cancelled  = キャンセル
 */
export type SessionStatus = "scheduled" | "completed" | "cancelled";

/** セッションの型 */
export type Session = {
  id: string;            // セッションID（UUID）
  user_id: string;       // 所有ユーザーのID
  scheduled_at: string;  // 予定日時（ISO 8601形式）
  status: SessionStatus; // ステータス
  memo: string;          // 事前メモ（アジェンダ・相談事項）
  summary: string;       // セッション後のまとめ（コーチが記録）
  created_at: string;    // 作成日時
  updated_at: string;    // 更新日時
};

/** セッション作成リクエストの型 */
export type CreateSessionRequest = {
  scheduled_at: string; // 予定日時（ISO 8601形式）
  memo?: string;        // 事前メモ（省略可）
};

/** セッション更新リクエストの型 */
export type UpdateSessionRequest = {
  scheduled_at?: string;  // 予定日時（完了済みセッションは変更不可）
  status?: SessionStatus; // ステータス
  memo?: string;          // 事前メモ
  summary?: string;       // セッションまとめ
};
