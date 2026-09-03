/**
 * ダッシュボード集計 API クライアント。
 */
import type { DashboardSummary, PlanVsActual } from "@/lib/types/dashboard";
import { apiRequest } from "./client";

/**
 * ホーム画面向けサマリー取得
 * GET /api/v1/plans/{planId}/dashboard/summary/
 */
export async function getDashboardSummary(planId: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(`/api/v1/plans/${planId}/dashboard/summary/`, {
    requiresAuth: true,
  });
}

/**
 * 計画画面向け計画vs実績取得
 * GET /api/v1/plans/{planId}/dashboard/plan-progress/
 */
export async function getPlanVsActual(planId: string): Promise<PlanVsActual> {
  return apiRequest<PlanVsActual>(`/api/v1/plans/${planId}/dashboard/plan-progress/`, {
    requiresAuth: true,
  });
}
