/**
 * API クライアント基盤。
 * すべての API 通信はこのクライアントを通じて行う。
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type RequestOptions = {
  method?: string;
  body?: unknown;
  requiresAuth?: boolean;
};

/** Cookie から id_token を取得する（localStorage は使用しない） */
function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )id_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** 共通 fetch ラッパー */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, requiresAuth = false } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (requiresAuth) {
    const token = getAccessToken();
    if (!token) {
      // トークンが存在しない場合は API を呼ばずに即座に認証エラーをスローする
      throw { status: 401, message: "認証が必要です。ログインしてください。" };
    }
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    let errorData: Record<string, unknown>;
    try {
      errorData = contentType.includes("application/json")
        ? (await response.json() as Record<string, unknown>)
        : { message: "サーバーエラーが発生しました。" };
    } catch {
      errorData = { message: "サーバーエラーが発生しました。" };
    }
    // status を付与して呼び出し元で 401/403 などを判別できるようにする
    throw { status: response.status, ...errorData };
  }

  return response.json() as Promise<T>;
}
