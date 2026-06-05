/**
 * API クライアント基盤。
 * すべての API 通信はこのクライアントを通じて行う。
 */

import { refreshIdToken } from "@/lib/auth/cognito";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  requiresAuth?: boolean;
};

/** Cookie から Cognito id_token を取得する */
function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )id_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Authorization ヘッダーを含むリクエストヘッダーを組み立てる */
function buildHeaders(requiresAuth: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

/**
 * 共通 fetch ラッパー。
 * 401 レスポンス時はリフレッシュトークンで再認証してリトライする。
 * リフレッシュ失敗時はログインページへリダイレクトする。
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, requiresAuth = false } = options;
  const serializedBody = body !== undefined ? JSON.stringify(body) : undefined;

  let response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: buildHeaders(requiresAuth),
    body: serializedBody,
  });

  // 401 の場合はリフレッシュトークンで再認証して同じリクエストをリトライする
  if (response.status === 401 && requiresAuth) {
    const newTokens = await refreshIdToken();
    if (newTokens) {
      // リフレッシュ成功：新しいトークン（Cookie に保存済み）でリトライする
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: buildHeaders(requiresAuth),
        body: serializedBody,
      });
    } else {
      // リフレッシュ失敗：セッション失効としてログインページへ遷移する
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
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
