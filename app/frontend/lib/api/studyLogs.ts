/**
 * 勉強記録 API クライアント。
 * 計画（plan）配下にネストされたエンドポイントを呼び出す。
 */

import type {
  CreateStudyLogRequest,
  StudyLog,
  StudyLogStats,
} from "../types/studyLogs";
import { apiRequest } from "./client";

/**
 * 勉強記録一覧取得
 * GET /api/v1/plans/{planId}/study-logs/
 */
export async function getStudyLogs(planId: string): Promise<StudyLog[]> {
  return apiRequest<StudyLog[]>(`/api/v1/plans/${planId}/study-logs/`, {
    requiresAuth: true,
  });
}

/**
 * 勉強記録作成
 * POST /api/v1/plans/{planId}/study-logs/
 */
export async function createStudyLog(
  planId: string,
  data: CreateStudyLogRequest
): Promise<StudyLog> {
  return apiRequest<StudyLog>(`/api/v1/plans/${planId}/study-logs/`, {
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

/**
 * 勉強記録削除
 * DELETE /api/v1/plans/{planId}/study-logs/{logId}/
 */
export async function deleteStudyLog(planId: string, logId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/plans/${planId}/study-logs/${logId}/`, {
    method: "DELETE",
    requiresAuth: true,
  });
}

/**
 * 勉強記録の集計取得（合計時間・時間帯別分布）
 * GET /api/v1/plans/{planId}/study-logs/stats/
 */
export async function getStudyLogStats(planId: string): Promise<StudyLogStats> {
  return apiRequest<StudyLogStats>(`/api/v1/plans/${planId}/study-logs/stats/`, {
    requiresAuth: true,
  });
}
