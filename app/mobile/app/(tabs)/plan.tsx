/**
 * 学習プラン画面（ガントチャート＋学習記録の一覧・集計）。
 * Web版 study-plan/page.tsx + StudyLogPanel.tsx のモバイル版統合。
 */
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { addDays, startOfWeek } from "date-fns";
import { router } from "expo-router";
import { Plus } from "lucide-react-native";
import { usePlanGanttContext } from "@/features/plans/PlanGanttProvider";
import { GanttChart } from "@/features/plans/components/GanttChart";
import { formatMinutes, trimSeconds } from "@/features/studyLogs/duration";

const TOTAL_DAYS = 8 * 7; // 8週間分表示

function getDisplayDates(start: Date, days: number): Date[] {
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

export default function PlanScreen() {
  const { gantt, studyLogs } = usePlanGanttContext();
  const { items, isLoading, error, targetDate, addItem, removeItem, updateItemName, toggleDates } = gantt;
  const { logs, stats, removeLog } = studyLogs;

  const [viewStart, setViewStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const dates = useMemo(() => getDisplayDates(viewStart, TOTAL_DAYS), [viewStart]);

  const itemNameById = useMemo(() => {
    const map = new Map<string, string>();
    items.forEach((i) => map.set(i.id, i.name));
    return map;
  }, [items]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {error && <Text style={styles.errorBanner}>{error}</Text>}

      <View style={styles.navRow}>
        <Pressable onPress={() => setViewStart((d) => addDays(d, -7))} style={styles.navButton}>
          <Text style={styles.navButtonText}>前の週</Text>
        </Pressable>
        <Pressable
          onPress={() => setViewStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          style={styles.navButton}
        >
          <Text style={styles.navButtonText}>今日</Text>
        </Pressable>
        <Pressable onPress={() => setViewStart((d) => addDays(d, 7))} style={styles.navButton}>
          <Text style={styles.navButtonText}>次の週</Text>
        </Pressable>
      </View>

      <GanttChart
        items={items}
        dates={dates}
        targetDate={targetDate}
        onToggleDates={toggleDates}
        onUpdateName={updateItemName}
        onRemoveItem={removeItem}
      />

      <Pressable style={styles.addItemButton} onPress={() => addItem("新しい単元")}>
        <Plus size={14} color="#4f46e5" />
        <Text style={styles.addItemButtonText}>単元を追加</Text>
      </Pressable>

      <View style={styles.statsCard}>
        <Text style={styles.statsLabel}>合計勉強時間</Text>
        <Text style={styles.statsValue}>{formatMinutes(stats.total_minutes)}</Text>
        <Text style={styles.statsSubtext}>全{stats.log_count}件の記録</Text>
      </View>

      <View style={styles.logsSection}>
        <View style={styles.logsSectionHeader}>
          <Text style={styles.logsTitle}>最近の記録</Text>
          <Pressable style={styles.recordButton} onPress={() => router.push("/study-log-modal")}>
            <Plus size={14} color="#ffffff" />
            <Text style={styles.recordButtonText}>記録する</Text>
          </Pressable>
        </View>

        {logs.length === 0 ? (
          <Text style={styles.emptyText}>まだ記録がありません。</Text>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logRow}>
              <View style={styles.logRowMain}>
                <Text style={styles.logDate}>{log.studied_on}</Text>
                <Text style={styles.logTime}>
                  {trimSeconds(log.start_time)}〜{trimSeconds(log.end_time)}
                </Text>
                <Text style={styles.logDuration}>{formatMinutes(log.duration_minutes)}</Text>
              </View>
              <Text style={styles.logMeta} numberOfLines={1}>
                {itemNameById.get(log.task_id) ?? "（削除された項目）"}
                {log.memo ? ` ・ ${log.memo}` : ""}
              </Text>
              <Pressable onPress={() => removeLog(log.id)} hitSlop={8}>
                <Text style={styles.deleteLink}>削除</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorBanner: {
    backgroundColor: "#fef2f2",
    color: "#b91c1c",
    fontSize: 12,
    padding: 10,
    borderRadius: 8,
  },
  navRow: { flexDirection: "row", gap: 8 },
  navButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    alignItems: "center",
  },
  navButtonText: { fontSize: 12, fontWeight: "600", color: "#4f46e5" },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#c7d2fe",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
  },
  addItemButtonText: { fontSize: 12, fontWeight: "600", color: "#4f46e5" },
  statsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
  },
  statsLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280" },
  statsValue: { fontSize: 26, fontWeight: "800", color: "#111827", marginTop: 4 },
  statsSubtext: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  logsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    gap: 10,
  },
  logsSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  logsTitle: { fontSize: 13, fontWeight: "700", color: "#374151" },
  recordButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#4f46e5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  recordButtonText: { color: "#ffffff", fontSize: 12, fontWeight: "700" },
  emptyText: { fontSize: 12, color: "#9ca3af" },
  logRow: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 10,
    gap: 2,
    marginBottom: 6,
  },
  logRowMain: { flexDirection: "row", alignItems: "center", gap: 8 },
  logDate: { fontSize: 12, fontWeight: "700", color: "#374151" },
  logTime: { fontSize: 12, color: "#6b7280" },
  logDuration: { fontSize: 12, fontWeight: "700", color: "#4f46e5" },
  logMeta: { fontSize: 11, color: "#9ca3af" },
  deleteLink: { fontSize: 11, color: "#dc2626", alignSelf: "flex-end", marginTop: 2 },
});
