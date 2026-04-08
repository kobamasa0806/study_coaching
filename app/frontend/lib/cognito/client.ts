/**
 * AWS Cognito クライアント設定。
 * amazon-cognito-identity-js を使用して Cognito User Pool に接続する。
 */

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
const COGNITO_APP_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ?? "";

/** Cognito User Pool インスタンス（アプリ全体で共有する）。 */
export const userPool = new CognitoUserPool({
  UserPoolId: COGNITO_USER_POOL_ID,
  ClientId: COGNITO_APP_CLIENT_ID,
});

/** Cognito 認証結果の型（アクセストークン・ID トークン・リフレッシュトークンを含む）。 */
export type CognitoTokens = {
  accessToken: string;  // API リクエストの Authorization ヘッダーに使用
  idToken: string;      // ユーザー情報取得用
  refreshToken: string; // トークン更新用
};

/**
 * メールアドレスとパスワードで Cognito 認証を行い、トークンを返す。
 */
export function cognitoSignIn(email: string, password: string): Promise<CognitoTokens> {
  return new Promise((resolve, reject) => {
    const authDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session: CognitoUserSession) {
        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
        });
      },
      onFailure(err: Error) {
        reject(err);
      },
    });
  });
}

/**
 * リフレッシュトークンを使ってセッションを更新し、新しいトークンを返す。
 */
export function cognitoRefreshSession(email: string): Promise<CognitoTokens> {
  return new Promise((resolve, reject) => {
    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    // 現在のセッションをプールから取得して更新する
    cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session) {
        reject(err ?? new Error("セッションが取得できませんでした。"));
        return;
      }
      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
}

/**
 * 現在ログイン中のユーザーをグローバルサインアウトする（全デバイスのセッションを無効化）。
 */
export function cognitoSignOut(): void {
  const currentUser = userPool.getCurrentUser();
  if (currentUser) {
    currentUser.globalSignOut({
      onSuccess: () => {},
      onFailure: () => {
        // グローバルサインアウト失敗時はローカルサインアウトにフォールバックする
        currentUser.signOut();
      },
    });
  }
}

/**
 * ローカルストレージに保存された Cognito セッションから現在のトークンを取得する。
 * セッションが存在しない場合は null を返す。
 */
export function getCognitoCurrentSession(): Promise<CognitoTokens | null> {
  return new Promise((resolve) => {
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) {
      resolve(null);
      return;
    }

    currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        resolve(null);
        return;
      }
      resolve({
        accessToken: session.getAccessToken().getJwtToken(),
        idToken: session.getIdToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
      });
    });
  });
}
