/**
 * AWS Cognito 設定。
 * Web版 (app/frontend/lib/auth/cognito.ts) と同じ Cognito App Client を、
 * 別のリダイレクトURI（カスタムURLスキーム）で利用する。
 */
import * as AuthSession from "expo-auth-session";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`環境変数 ${name} が設定されていません。`);
  }
  return value;
}

export const cognitoConfig = {
  domain: requireEnv("EXPO_PUBLIC_COGNITO_DOMAIN", process.env.EXPO_PUBLIC_COGNITO_DOMAIN),
  clientId: requireEnv(
    "EXPO_PUBLIC_COGNITO_CLIENT_ID",
    process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID
  ),
  apiBaseUrl: requireEnv(
    "EXPO_PUBLIC_API_BASE_URL",
    process.env.EXPO_PUBLIC_API_BASE_URL
  ),
};

/** Cognito Hosted UI のディスカバリー情報（明示的に定義し、起動時の余計な通信を避ける） */
export const cognitoDiscovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: `${cognitoConfig.domain}/oauth2/authorize`,
  tokenEndpoint: `${cognitoConfig.domain}/oauth2/token`,
  revocationEndpoint: `${cognitoConfig.domain}/oauth2/revoke`,
};

/** アプリのカスタムURLスキームによるコールバックURI（例: kensan://callback） */
export const cognitoRedirectUri = AuthSession.makeRedirectUri({
  scheme: "kensan",
  path: "callback",
});
