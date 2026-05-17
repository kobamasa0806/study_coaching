/**
 * 認証関連の型定義
 */

/** ユーザー情報レスポンスの型 */
export type UserResponse = {
  id: string;         // ユーザーID（UUID）
  email: string;      // メールアドレス
  username: string;   // ユーザー名
  is_staff: boolean;  // 管理者フラグ
  created_at: string; // 作成日時（ISO 8601形式）
};

/** API エラーレスポンスの型 */
export type ApiError = {
  error: {
    code: string;
    message: string | Record<string, string[]>;
  };
};
