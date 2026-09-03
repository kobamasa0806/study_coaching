/**
 * Cognito Hosted UI を Authorization Code + PKCE フローでブラウザ経由利用するフック。
 * Web版 (app/frontend/lib/auth/cognito.ts) の initiateLogin / exchangeCodeForTokens に相当。
 */
import { useCallback } from "react";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { cognitoConfig, cognitoDiscovery, cognitoRedirectUri } from "./cognitoConfig";
import { saveTokens, type CognitoTokens } from "./tokenStorage";

// ブラウザで認証を完了した後、アプリに制御を戻すために必要（モジュールスコープで一度だけ呼ぶ）
WebBrowser.maybeCompleteAuthSession();

export function useCognitoAuth() {
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: cognitoConfig.clientId,
      redirectUri: cognitoRedirectUri,
      scopes: ["openid", "email", "profile"],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { lang: "ja" },
    },
    cognitoDiscovery
  );

  const login = useCallback(async (): Promise<CognitoTokens | null> => {
    const result = await promptAsync();
    if (result.type !== "success" || !request?.codeVerifier) {
      return null;
    }

    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: cognitoConfig.clientId,
        code: result.params.code,
        redirectUri: cognitoRedirectUri,
        extraParams: { code_verifier: request.codeVerifier },
      },
      cognitoDiscovery
    );

    const tokens: CognitoTokens = {
      id_token: tokenResponse.idToken ?? "",
      access_token: tokenResponse.accessToken,
      refresh_token: tokenResponse.refreshToken ?? "",
      expires_in: tokenResponse.expiresIn ?? 0,
    };
    await saveTokens(tokens);
    return tokens;
  }, [promptAsync, request]);

  return { request, response, login };
}
