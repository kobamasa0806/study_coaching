/**
 * 計画画面向け計画vs実績の取得（React Query）。
 */
import { useQuery } from "@tanstack/react-query";
import { getPlanVsActual } from "@/lib/api/dashboard";

export function useDashboardPlanProgress(planId: string | null) {
  return useQuery({
    queryKey: ["dashboard-plan-progress", planId],
    queryFn: () => getPlanVsActual(planId as string),
    enabled: planId !== null,
  });
}
