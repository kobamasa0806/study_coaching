/**
 * AWS Cognito 認証ユーティリティ。
 * Authorization Code + PKCE フローで Cognito Hosted UI に認証を委譲する。
 *
 * フロー:
 * 1. initiateLogin() → PKCE + state を生成して Cognito Hosted UI にリダイレクト
 * 2. Cognito Hosted UI でユーザーがログイン（メールアドレス＋パスワード）
 * 3. Cognito が /callback?code=...&state=... にリダイレクト
 * 4. exchangeCodeForTokens() → code + code_verifier でトークンを取得
 * 5. saveTokens() でトークンを Cookie に保存
 */

/** Cognito から受け取るトークンセット */
export type CognitoTokens = {
  id_token: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
};

/** 環境変数から Cognito 設定を取得する */
function getConfig() {
  return {
    domain: process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? "",
    clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
    redirectUri: process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? "",
    logoutUri: process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ?? "",
  };
}

// ---- PKCE ヘルパー ----

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest("SHA-256", encoder.encode(plain));
}

function base64urlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ---- Cookie ヘルパー ----

/** Secure フラグ（HTTPS 環境のみ）と SameSite=Strict を付与した Cookie 属性を返す */
function cookieAttributes(maxAgeSec: number): string {
  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  return `; path=/; SameSite=Strict${secure}; max-age=${maxAgeSec}`;
}

/** Cookie から指定名の値を取得する */
function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
}

// ---- トークン保存・取得 ----

/**
 * トークンを Cookie のみに保存する。
 * id_token: 1日（Cognito の id_token デフォルト有効期限に合わせる）
 * refresh_token: 30日
 */
export function saveTokens(tokens: CognitoTokens): void {
  document.cookie = `id_token=${encodeURIComponent(tokens.id_token)}${cookieAttributes(86400)}`;
  document.cookie = `refresh_token=${encodeURIComponent(tokens.refresh_token)}${cookieAttributes(2592000)}`;
}

/** Cookie からトークンを削除する */
export function clearTokens(): void {
  document.cookie = "id_token=; path=/; SameSite=Strict; max-age=0";
  document.cookie = "refresh_token=; path=/; SameSite=Strict; max-age=0";
}

/** Cookie から id_token を取得する */
export function getIdToken(): string | null {
  return getCookieValue("id_token");
}

/** Cookie から refresh_token を取得する */
export function getRefreshToken(): string | null {
  return getCookieValue("refresh_token");
}

// ---- OAuth フロー ----

/**
 * Cognito Hosted UI へのログインフローを開始する。
 * PKCE の code_verifier と CSRF 対策の state を sessionStorage に保存してリダイレクトする。
 * Cognito Hosted UI 上でユーザーがメールアドレス＋パスワードを入力する。
 */
export async function initiateLogin(): Promise<void> {
  const { domain, clientId, redirectUri } = getConfig();
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64urlEncode(await sha256(codeVerifier));
  // CSRF 対策: state パラメータで callback の正当性を検証する
  const state = generateRandomString(32);

  sessionStorage.setItem("pkce_code_verifier", codeVerifier);
  sessionStorage.setItem("pkce_state", state);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "openid email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
  });

  window.location.href = `${domain}/oauth2/authorize?${params.toString()}`;
}

/**
 * Authorization Code を Cognito トークンに交換する。
 * /callback ページから呼び出す。
 */
export async function exchangeCodeForTokens(code: string): Promise<CognitoTokens> {
  const { domain, clientId, redirectUri } = getConfig();
  const codeVerifier = sessionStorage.getItem("pkce_code_verifier");

  if (!codeVerifier) {
    throw new Error("code_verifier が見つかりません。ログインをやり直してください。");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code,
    code_verifier: codeVerifier,
  });

  const response = await fetch(`${domain}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error("トークン交換に失敗しました。しばらくしてからお試しください。");
  }

  sessionStorage.removeItem("pkce_code_verifier");
  return response.json() as Promise<CognitoTokens>;
}

/**
 * リフレッシュトークンを使って id_token を更新する。
 * 失敗した場合は null を返す。
 */
export async function refreshIdToken(): Promise<CognitoTokens | null> {
  const { domain, clientId } = getConfig();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });

  try {
    const response = await fetch(`${domain}/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!response.ok) return null;

    const tokens = (await response.json()) as CognitoTokens;
    // リフレッシュレスポンスには refresh_token が含まれないため既存のものを引き継ぐ
    tokens.refresh_token = refreshToken;
    saveTokens(tokens);
    return tokens;
  } catch {
    return null;
  }
}

/**
 * リフレッシュトークンをサーバー側で失効させてからログアウトする。
 * Cognito の /logout エンドポイントは使用せず、ローカルのトークンを削除してホームページへ遷移する。
 */
export async function cognitoLogout(): Promise<void> {
  const { domain, clientId } = getConfig();
  const refreshToken = getRefreshToken();

  // リフレッシュトークンを Cognito サーバー側で失効させる
  if (refreshToken) {
    try {
      await fetch(`${domain}/oauth2/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          token: refreshToken,
        }).toString(),
      });
    } catch {
      // 失効リクエストが失敗してもローカルのトークン削除とリダイレクトは続行する
    }
  }

  clearTokens();
  window.location.href = "/";
}
