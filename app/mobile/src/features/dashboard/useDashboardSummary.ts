/**
 * ホーム画面向けダッシュボードサマリーの取得（React Query）。
 */
import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/lib/api/dashboard";

export function useDashboardSummary(planId: string | null) {
  return useQuery({
    queryKey: ["dashboard-summary", planId],
    queryFn: () => getDashboardSummary(planId as string),
    enabled: planId !== null,
  });
}
