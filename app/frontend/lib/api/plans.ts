/**
 * 学習計画 API クライアント。
 */

import type { CreatePlanRequest, Plan, UpdatePlanRequest } from "../types/plans";
import { apiRequest } from "./client";

/**
 * 学習計画一覧取得
 * GET /api/v1/plans/
 */
export async function getPlans(): Promise<Plan[]> {
  return apiRequest<Plan[]>("/api/v1/plans/", { requiresAuth: true });
}

/**
 * 学習計画作成
 * POST /api/v1/plans/
 */
export async function createPlan(data: CreatePlanRequest): Promise<Plan> {
  return apiRequest<Plan>("/api/v1/plans/", {
    method: "POST",
    body: data,
    requiresAuth: true,
  });
}

/**
 * 学習計画詳細取得
 * GET /api/v1/plans/{id}/
 */
export async function getPlan(planId: string): Promise<Plan> {
  return apiRequest<Plan>(`/api/v1/plans/${planId}/`, { requiresAuth: true });
}

/**
 * 学習計画更新
 * PUT /api/v1/plans/{id}/
 */
export async function updatePlan(planId: string, data: UpdatePlanRequest): Promise<Plan> {
  return apiRequest<Plan>(`/api/v1/plans/${planId}/`, {
    method: "PUT",
    body: data,
    requiresAuth: true,
  });
}

/**
 * 学習計画削除
 * DELETE /api/v1/plans/{id}/
 */
export async function deletePlan(planId: string): Promise<void> {
  return apiRequest<void>(`/api/v1/plans/${planId}/`, {
    method: "DELETE",
    requiresAuth: true,
  });
}
