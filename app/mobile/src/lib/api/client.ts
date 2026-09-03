/**
 * API クライアント基盤。
 * すべての API 通信はこのクライアントを通じて行う。
 * Web版 (app/frontend/lib/api/client.ts) の移植。トークン取得が非同期になる点、
 * リフレッシュ失敗時に window.location の代わりに onSessionExpired コールバックを
 * 呼ぶ点が差異（features/auth 側からの循環importを避けるための間接呼び出し）。
 */
import { cognitoConfig } from "@/features/auth/cognitoConfig";
import { getIdToken } from "@/features/auth/tokenStorage";
import { refreshIdToken } from "@/features/auth/refreshToken";

const API_BASE_URL = cognitoConfig.apiBaseUrl;

type RequestOptions = {
  method?: string;
  body?: unknown;
  requiresAuth?: boolean;
};

/** セッション失効時に呼ばれるコールバック（AuthProviderが起動時に登録する） */
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

/** Authorization ヘッダーを含むリクエストヘッダーを組み立てる */
async function buildHeaders(requiresAuth: boolean): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (requiresAuth) {
    const token = await getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * 共通 fetch ラッパー。
 * 401 レスポンス時はリフレッシュトークンで再認証してリトライする。
 * リフレッシュ失敗時はセッション失効ハンドラーを呼び出す。
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, requiresAuth = false } = options;
  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;

  let response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: await buildHeaders(requiresAuth),
    body: serializedBody,
  });

  // 401 の場合はリフレッシュトークンで再認証して同じリクエストをリトライする
  if (response.status === 401 && requiresAuth) {
    const newTokens = await refreshIdToken();
    if (newTokens) {
      // リフレッシュ成功：新しいトークン（SecureStoreに保存済み）でリトライする
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: await buildHeaders(requiresAuth),
        body: serializedBody,
      });
    } else {
      // リフレッシュ失敗：セッション失効としてログイン画面へ遷移する
      onSessionExpired?.();
      throw new Error("セッションが切れました。再度ログインしてください。");
    }
  }

  // 204 No Content はボディなしで成功とする
  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data as T;
}
