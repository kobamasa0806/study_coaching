/**
 * リフレッシュトークンを使って id_token を更新する。
 * Web版 (app/frontend/lib/auth/cognito.ts の refreshIdToken) と同じロジック。
 */
import { cognitoConfig } from "./cognitoConfig";
import { getRefreshToken, saveTokens, type CognitoTokens } from "./tokenStorage";

export async function refreshIdToken(): Promise<CognitoTokens | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: cognitoConfig.clientId,
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(`${cognitoConfig.domain}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) return null;

    const tokens = (await response.json()) as CognitoTokens;
    // リフレッシュレスポンスには refresh_token が含まれないため既存のものを引き継ぐ
    tokens.refresh_token = refreshToken;
    await saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}
