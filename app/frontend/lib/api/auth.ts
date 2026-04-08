/**
 * 認証関連の API クライアント。
 * ログイン・ログアウト・トークン更新は Cognito SDK を直接使用し、
 * ユーザー登録とプロフィール取得はバックエンド API を使用する。
 */

import {
  cognitoSignIn,
  cognitoSignOut,
  getCognitoCurrentSession,
  type CognitoTokens,
} from "../cognito/client";
import type { LoginRequest, RegisterRequest, UserResponse } from "../types/auth";
import { apiRequest } from "./client";

/** Cognito トークンをローカルストレージと Cookie の両方に保存する。 */
function saveTokens(tokens: CognitoTokens): void {
  // ローカルストレージ: JS からの参照用
  localStorage.setItem("access_token", tokens.accessToken);
  localStorage.setItem("id_token", tokens.idToken);
  localStorage.setItem("refresh_token", tokens.refreshToken);
  // Cookie: Next.js middleware でのルート保護用
  document.cookie = `access_token=${tokens.accessToken}; path=/; SameSite=Strict`;
}

/** トークンをローカルストレージと Cookie から削除する。 */
function clearTokens(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("id_token");
  localStorage.removeItem("refresh_token");
  document.cookie = "access_token=; path=/; max-age=0";
}

/**
 * ユーザー登録
 * POST /api/v1/auth/register/
 * Cognito と ローカル DB の両方にユーザーを作成する。
 */
export async function register(data: RegisterRequest): Promise<UserResponse> {
  return apiRequest<UserResponse>("/api/v1/auth/register/", {
    method: "POST",
    body: data,
  });
}

/**
 * ログイン（Cognito 認証）
 * Cognito SDK で直接認証し、取得したトークンを保存する。
 */
export async function login(data: LoginRequest): Promise<CognitoTokens> {
  const tokens = await cognitoSignIn(data.email, data.password);
  saveTokens(tokens);
  return tokens;
}

/**
 * アクセストークンの更新
 * Cognito SDK の getSession を使って現在のセッションを更新する。
 */
export async function refreshToken(): Promise<CognitoTokens | null> {
  const tokens = await getCognitoCurrentSession();
  if (tokens) {
    saveTokens(tokens);
  }
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
 * ログアウト
 * Cognito でグローバルサインアウトし、ローカルのトークンを削除する。
 */
export async function logout(): Promise<void> {
  cognitoSignOut();
  clearTokens();
}
