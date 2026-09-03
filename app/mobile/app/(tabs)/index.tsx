/**
 * ホーム画面。進捗率・今日の学習時間・連続学習日数を表示する。
 */
import { useCallback } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Flame, Percent, Timer } from "lucide-react-native";
import { usePlanGanttContext } from "@/features/plans/PlanGanttProvider";
import { useDashboardSummary } from "@/features/dashboard/useDashboardSummary";
import { formatMinutes } from "@/features/studyLogs/duration";

export default function HomeScreen() {
  const { gantt } = usePlanGanttContext();
  const { data, isLoading, isFetching, error, refetch } = useDashboardSummary(gantt.planId);

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

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
    >
      {error && <Text style={styles.errorText}>サマリーの取得に失敗しました。</Text>}

      <StatCard
        icon={<Percent size={20} color="#4f46e5" />}
        label="進捗率"
        value={`${Math.round(data?.progress_percent ?? 0)}%`}
        accentColor="#eef2ff"
      />
      <StatCard
        icon={<Timer size={20} color="#059669" />}
        label="今日の学習時間"
        value={formatMinutes(data?.today_study_minutes ?? 0)}
        accentColor="#ecfdf5"
      />
      <StatCard
        icon={<Flame size={20} color="#ea580c" />}
        label="連続学習日数"
        value={`${data?.streak_days ?? 0}日`}
        accentColor="#fff7ed"
      />
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accentColor: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor }]}>{icon}</View>
      <View>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 12 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { color: "#dc2626", fontSize: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontSize: 12, color: "#6b7280" },
  cardValue: { fontSize: 22, fontWeight: "800", color: "#111827", marginTop: 2 },
});
