/**
 * ガントチャートのヘッダー（月ラベル行＋曜日行＋日付行）。
 * 列のx座標はジオメトリ計算（ganttGeometry）から得た値を絶対配置で使う
 * （RNにはHTMLのrowSpan/colSpanに相当する仕組みが無いため）。
 */
import { Pressable, StyleSheet, Text, View } from "react-native";
import { isToday, isWeekend } from "date-fns";
import { ChevronDown, ChevronRight } from "lucide-react-native";
import type { MonthInfo } from "../ganttDate";
import { dayOfMonthLabel, toDateStr, weekdayLabel } from "../ganttDate";
import type { GridColumn } from "../ganttGeometry";
import { computeMonthBlocks } from "../ganttGeometry";

export const HEADER_ROW1_HEIGHT = 24;
export const HEADER_ROW23_HEIGHT = 20;
export const HEADER_HEIGHT = HEADER_ROW1_HEIGHT + HEADER_ROW23_HEIGHT * 2;

type Props = {
  monthInfos: MonthInfo[];
  columns: GridColumn[];
  collapsedMonths: ReadonlySet<string>;
  onToggleMonth: (key: string) => void;
  width: number;
};

export function GanttHeader({ monthInfos, columns, collapsedMonths, onToggleMonth, width }: Props) {
  const monthBlocks = computeMonthBlocks(monthInfos, columns, collapsedMonths);
  const columnByDate = new Map<string, GridColumn>();
  for (const col of columns) {
    if (col.dateStr) columnByDate.set(col.dateStr, col);
  }

  return (
    <View style={[styles.container, { width, height: HEADER_HEIGHT }]}>
      {monthBlocks.map((block) =>
        block.collapsed ? (
          <Pressable
            key={block.key}
            onPress={() => onToggleMonth(block.key)}
            style={[
              styles.collapsedCell,
              { left: block.x, width: block.width, top: 0, height: HEADER_HEIGHT },
            ]}
          >
            <Text style={styles.collapsedLabel}>{block.monthLabel}</Text>
            <ChevronRight size={10} color="#9ca3af" />
          </Pressable>
        ) : (
          <Pressable
            key={block.key}
            onPress={() => onToggleMonth(block.key)}
            style={[
              styles.monthCell,
              { left: block.x, width: block.width, top: 0, height: HEADER_ROW1_HEIGHT },
            ]}
          >
            <Text style={styles.monthLabel} numberOfLines={1}>
              {block.yearLabel} {block.monthLabel}
            </Text>
            <ChevronDown size={10} color="#9ca3af" />
          </Pressable>
        )
      )}

      {monthInfos.flatMap((m) => {
        if (collapsedMonths.has(m.key)) return [];
        return m.dates.map((date) => {
          const col = columnByDate.get(toDateStr(date));
          if (!col) return null;
          const weekend = isWeekend(date);
          const today = isToday(date);
          return (
            <View key={`wd-${col.dateStr}`}>
              <View
                style={[
                  styles.dayCell,
                  today
                    ? styles.todayCell
                    : weekend
                      ? styles.weekendCell
                      : undefined,
                  { left: col.x, width: col.width, top: HEADER_ROW1_HEIGHT, height: HEADER_ROW23_HEIGHT },
                ]}
              >
                <Text style={[styles.dayCellText, today && styles.todayText, weekend && styles.weekendText]}>
                  {weekdayLabel(date)}
                </Text>
              </View>
              <View
                style={[
                  styles.dayCell,
                  today
                    ? styles.todayCell
                    : weekend
                      ? styles.weekendCell
                      : undefined,
                  {
                    left: col.x,
                    width: col.width,
                    top: HEADER_ROW1_HEIGHT + HEADER_ROW23_HEIGHT,
                    height: HEADER_ROW23_HEIGHT,
                  },
                ]}
              >
                <Text style={[styles.dayCellText, today && styles.todayText, weekend && styles.weekendText]}>
                  {dayOfMonthLabel(date)}
                </Text>
              </View>
            </View>
          );
        });
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  monthCell: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },
  monthLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  collapsedCell: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: "#f3f4f6",
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },
  collapsedLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#6b7280",
    writingDirection: "ltr",
  },
  dayCell: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
  },
  dayCellText: {
    fontSize: 10,
    color: "#6b7280",
  },
  todayCell: {
    backgroundColor: "#4f46e5",
  },
  todayText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  weekendCell: {
    backgroundColor: "#fef2f2",
  },
  weekendText: {
    color: "#f87171",
  },
});
