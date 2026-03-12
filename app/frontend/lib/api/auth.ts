/**
 * 認証関連の API クライアント。
 */

import type {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  UserResponse,
} from "../types/auth";
import { apiRequest } from "./client";

/** トークンをローカルストレージと Cookie の両方に保存する。 */
function saveTokens(tokens: TokenResponse): void {
  // ローカルストレージ: JS からの参照用
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
  // Cookie: middleware でのルート保護用
  document.cookie = `access_token=${tokens.access}; path=/; SameSite=Strict`;
  document.cookie = `refresh_token=${tokens.refresh}; path=/; SameSite=Strict`;
}

/** トークンをローカルストレージと Cookie の両方から削除する。 */
function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0";
  document.cookie = "refresh_token=; path=/; max-age=0";
}

/**
 * ユーザー登録
 * POST /api/v1/auth/register/
 */
export async function register(data: RegisterRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>("/api/v1/auth/register/", {
    method: "POST",
    body: data,
  });
}

/**
 * ログイン（JWT トークン取得）
 * POST /api/v1/auth/token/
 */
export async function login(data: LoginRequest): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>("/api/v1/auth/token/", {
    method: "POST",
    body: data,
  });
  saveTokens(tokens);
  return tokens;
}

/**
 * アクセストークンの更新
 * POST /api/v1/auth/token/refresh/
 */
export async function refreshToken(refresh: string): Promise<TokenResponse> {
  const tokens = await apiRequest<TokenResponse>("/api/v1/auth/token/refresh/", {
    method: "POST",
    body: { refresh },
  });
  saveTokens(tokens);
  return tokens;
}

/**
 * ログイン中ユーザー情報の取得
 * GET /api/v1/auth/me/
 */
export async function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>("/api/v1/auth/me/", {
    requiresAuth: true,
  });
}

/**
 * ログアウト（ローカルのトークンを削除）
 */
export function logout(): void {
  clearTokens();
}
