/**
 * 計画画面。計画vs実績・完了/遅れ/延期/順調の単元数・単元別内訳を表示する。
 */
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { usePlanGanttContext } from "@/features/plans/PlanGanttProvider";
import { useDashboardPlanProgress } from "@/features/dashboard/useDashboardPlanProgress";
import type { UnitStatus } from "@/lib/types/dashboard";

const STATUS_LABEL: Record<UnitStatus, string> = {
  completed: "完了",
  delayed: "遅れ",
  postponed: "延期",
  on_track: "順調",
  unscheduled: "未設定",
};

const STATUS_COLOR: Record<UnitStatus, string> = {
  completed: "#059669",
  delayed: "#dc2626",
  postponed: "#d97706",
  on_track: "#4f46e5",
  unscheduled: "#9ca3af",
};

export default function ProgressScreen() {
  const { gantt } = usePlanGanttContext();
  const { data, isLoading, isFetching, error, refetch } = useDashboardPlanProgress(gantt.planId);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const completionPercent = Math.round((data?.completion_rate ?? 0) * 100);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      {error && <Text style={styles.errorText}>計画vs実績の取得に失敗しました。</Text>}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>計画の達成率</Text>
        <Text style={styles.percentValue}>{completionPercent}%</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${completionPercent}%` }]} />
        </View>
        <Text style={styles.progressSubtext}>
          {data?.total_studied_days ?? 0} / {data?.total_planned_days ?? 0} 日 実施
        </Text>
      </View>

      <View style={styles.tileRow}>
        <StatusTile status="completed" count={data?.completed_count ?? 0} />
        <StatusTile status="delayed" count={data?.delayed_count ?? 0} />
        <StatusTile status="postponed" count={data?.postponed_count ?? 0} />
        <StatusTile status="on_track" count={data?.on_track_count ?? 0} />
        {(data?.unscheduled_count ?? 0) > 0 && (
          <StatusTile status="unscheduled" count={data!.unscheduled_count} />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>単元ごとの内訳</Text>
        {data && data.units.length > 0 ? (
          data.units.map((unit) => (
            <View key={unit.task_id} style={styles.unitRow}>
              <View style={styles.unitMain}>
                <Text style={styles.unitTitle} numberOfLines={1}>
                  {unit.title}
                </Text>
                <View style={[styles.badge, { backgroundColor: STATUS_COLOR[unit.status] }]}>
                  <Text style={styles.badgeText}>{STATUS_LABEL[unit.status]}</Text>
                </View>
              </View>
              <Text style={styles.unitDays}>
                {unit.studied_days} / {unit.planned_days} 日
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>まだ単元がありません。</Text>
        )}
      </View>
    </ScrollView>
  );
}

function StatusTile({ status, count }: { status: UnitStatus; count: number }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileCount, { color: STATUS_COLOR[status] }]}>{count}</Text>
      <Text style={styles.tileLabel}>{STATUS_LABEL[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#dc2626", fontSize: 12 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 8,
  },
  cardLabel: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  percentValue: { fontSize: 30, fontWeight: "800", color: "#111827" },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#4f46e5" },
  progressSubtext: { fontSize: 11, color: "#9ca3af" },
  tileRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: {
    flexGrow: 1,
    minWidth: "22%",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 12,
    alignItems: "center",
  },
  tileCount: { fontSize: 20, fontWeight: "800" },
  tileLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  unitRow: {
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
    paddingVertical: 10,
    gap: 4,
  },
  unitMain: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  unitTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: "#1f2937" },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#ffffff" },
  unitDays: { fontSize: 11, color: "#9ca3af" },
  emptyText: { fontSize: 12, color: "#9ca3af" },
});
