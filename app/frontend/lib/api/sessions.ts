/**
 * 1on1 セッション API クライアント。
 */

import type { CreateSessionRequest, Session, UpdateSessionRequest } from "../types/sessions";
import { apiRequest } from "./client";

/**
 * セッション一覧取得
 * GET /api/v1/sessions/
 */
export async function getSessions(): Promise<Session[]> {
  return apiRequest<Session[]>("/api/v1/sessions/", { requiresAuth: true });
}

/**
 * セッション作成
 * POST /api/v1/sessions/
 */
export async function createSession(data: CreateSessionRequest): Promise<Session> {
  return apiRequest<Session>("/api/v1/sessions/", {
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

/**
 * セッション更新
 * PUT /api/v1/sessions/{id}/
 */
export async function updateSession(sessionId: string, data: UpdateSessionRequest): Promise<Session> {
  return apiRequest<Session>(`/api/v1/sessions/${sessionId}/`, {
    method: "PUT",
    body: data,
    requiresAuth: true,
  });
}

/**
 * セッション削除
 * DELETE /api/v1/sessions/{id}/
 */
export async function deleteSession(sessionId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/sessions/${sessionId}/`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
