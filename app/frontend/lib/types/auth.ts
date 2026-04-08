/**
 * 認証関連の型定義
 */

/** ユーザー登録リクエストの型 */
export type RegisterRequest = {
  email: string;    // メールアドレス
  username: string; // ユーザー名
  password: string; // パスワード（8文字以上）
};

/** ログインリクエストの型 */
export type LoginRequest = {
  email: string;    // メールアドレス
  password: string; // パスワード
};

/** ユーザー情報レスポンスの型 */
export type UserResponse = {
  id: string;         // ユーザーID（UUID）
  email: string;      // メールアドレス
  username: string;   // ユーザー名
  created_at: string; // 作成日時（ISO 8601形式）
};

/** API エラーレスポンスの型 */
export type ApiError = {
  error: {
    code: string;                               // エラーコード（例: "NOT_FOUND", "VALIDATION_ERROR"）
    message: string | Record<string, string[]>; // エラーメッセージ（フィールドエラーの場合はオブジェクト形式）
  };
};

/** Cognito 認証エラーの型 */
export type CognitoAuthError = {
  code: string;    // Cognito エラーコード（例: "NotAuthorizedException", "UserNotFoundException"）
  message: string; // エラーメッセージ
};
