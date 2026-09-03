/**
 * Cognitoトークンの永続化。
 * Web版はCookie保存だが、モバイルはKeychain/Keystoreに保存する expo-secure-store を使う
 * （CLAUDE.mdの規約通り、トークンをAsyncStorage等の非セキュアな領域には保存しない）。
 */
import * as SecureStore from "expo-secure-store";

const ID_TOKEN_KEY = "kensan_id_token";
const REFRESH_TOKEN_KEY = "kensan_refresh_token";

export type CognitoTokens = {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

export async function saveTokens(tokens: CognitoTokens): Promise<void> {
  await SecureStore.setItemAsync(ID_TOKEN_KEY, tokens.id_token);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refresh_token);
}

export async function getIdToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ID_TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ID_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
