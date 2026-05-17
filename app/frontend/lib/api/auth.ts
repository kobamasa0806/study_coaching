/**
 * 認証関連の API クライアント。
 * 認証フロー（ログイン・トークン交換）は lib/auth/cognito.ts で管理する。
 * このファイルはバックエンド API との通信のみを担当する。
 */

import type { UserResponse } from "../types/auth";
import { apiRequest } from "./client";

/**
 * ログイン中ユーザー情報の取得
 * GET /api/v1/auth/me/
 * Cognito id_token を Bearer トークンとして送信する。
 */
export async function getMe(): Promise<UserResponse> {
  return apiRequest<UserResponse>("/api/v1/auth/me/", {
    requiresAuth: true,
  });
}
