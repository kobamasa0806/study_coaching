/**
 * ガントチャートコンポーネント（React Native版）。
 * Web版 (app/frontend/app/study-plan/components/GanttChart.tsx) の移植。
 * - 各項目（タスク）は「計画」行と「実績」行の2行で構成される
 * - 計画行はセルを指でなぞって日付を塗りつぶす（もしくは消す）
 * - 実績行は手動での塗りつぶし不可。学習の記録（StudyLog）の追加・削除で自動的に反映される
 * - 月ラベルをタップすると列を折りたたみ/展開できる
 * - 項目名はタップして編集できる
 * - ドラッグ中は縦横スクロールを完全にロックする
 */
import { useMemo, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Svg from "react-native-svg";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Check, Pencil, Trash2 } from "lucide-react-native";
import type { GanttItem, GanttRowType } from "../types";
import { buildMonthInfos, toDateStr } from "../ganttDate";
import {
  buildGridColumns,
  CELL_HEIGHT_MOBILE,
  CELL_WIDTH_MOBILE,
  columnAtX,
  gridTotalWidth,
  NAME_COL_WIDTH_MOBILE,
  rowAtY,
} from "../ganttGeometry";
import { computeDragDiff } from "../ganttDragMath";
import { GanttHeader, HEADER_HEIGHT } from "./GanttHeader";
import { GanttRow } from "./GanttRow";

type Props = {
  items: GanttItem[];
  dates: Date[];
  /** 学習プランの目標日（"yyyy-MM-dd" 形式） */
  targetDate?: string | null;
  onToggleDates: (itemId: string, rowType: GanttRowType, dates: string[], fill: boolean) => void;
  onUpdateName: (id: string, name: string) => void;
  onRemoveItem: (id: string) => void;
};

type DragState = {
  itemId: string;
  rowType: GanttRowType;
  fill: boolean;
  startDate: string;
  lastDate: string;
};

export function GanttChart({ items, dates, targetDate, onToggleDates, onUpdateName, onRemoveItem }: Props) {
  const [collapsedMonths, setCollapsedMonths] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);

  const monthInfos = useMemo(() => buildMonthInfos(dates), [dates]);
  const allDateStrs = useMemo(() => dates.map(toDateStr), [dates]);
  const columns = useMemo(
    () => buildGridColumns(monthInfos, collapsedMonths, CELL_WIDTH_MOBILE),
    [monthInfos, collapsedMonths]
  );
  const gridWidth = gridTotalWidth(columns);
  const gridHeight = items.length * CELL_HEIGHT_MOBILE * 2;

  function toggleMonth(key: string) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function cellInfoAt(x: number, y: number) {
    const row = rowAtY(y, CELL_HEIGHT_MOBILE, items.length);
    if (!row) return null;
    const col = columnAtX(columns, x);
    if (!col || col.dateStr === null) return null;
    const item = items[row.itemIndex];
    if (!item) return null;
    return { itemId: item.id, rowType: row.rowType, dateStr: col.dateStr };
  }

  function handlePaintStart(x: number, y: number) {
    const info = cellInfoAt(x, y);
    // 実績行は記録（StudyLog）からのみ自動的に塗られるため、手動での塗りつぶしを禁止する
    if (!info || info.rowType === "actual") return;
    const item = items.find((i) => i.id === info.itemId);
    if (!item) return;
    const arr = info.rowType === "plan" ? item.planDates : item.actualDates;
    const fill = !arr.includes(info.dateStr);

    dragRef.current = {
      itemId: info.itemId,
      rowType: info.rowType,
      fill,
      startDate: info.dateStr,
      lastDate: info.dateStr,
    };
    setIsDragging(true);
    onToggleDates(info.itemId, info.rowType, [info.dateStr], fill);
  }

  function handlePaintUpdate(x: number, y: number) {
    const drag = dragRef.current;
    if (!drag) return;
    const info = cellInfoAt(x, y);
    if (!info || info.itemId !== drag.itemId || info.rowType !== drag.rowType) return;
    if (info.dateStr === drag.lastDate) return;

    const diff = computeDragDiff(allDateStrs, drag.startDate, drag.lastDate, info.dateStr);
    if (diff.toApply.length) onToggleDates(drag.itemId, drag.rowType, diff.toApply, drag.fill);
    if (diff.toUndo.length) onToggleDates(drag.itemId, drag.rowType, diff.toUndo, !drag.fill);
    drag.lastDate = info.dateStr;
  }

  function handlePaintEnd() {
    dragRef.current = null;
    setIsDragging(false);
  }

  // minDistance(0): タップした瞬間にドラッグ判定を開始させ、Web版のmousedown/touchstart相当の
  // 「押した瞬間に1セル塗る」動作を再現する。
  // dragRef への読み書きは runOnJS 経由でジェスチャーイベント発生時にのみ実行され、
  // レンダー中に読まれることはない（react-hooks/refs はジェスチャービルダーの実行モデルを
  // 静的に判定できないための誤検知）。
  /* eslint-disable react-hooks/refs */
  const panGesture = Gesture.Pan()
    .minDistance(0)
    .onStart((e) => {
      runOnJS(handlePaintStart)(e.x, e.y);
    })
    .onUpdate((e) => {
      runOnJS(handlePaintUpdate)(e.x, e.y);
    })
    .onFinalize(() => {
      runOnJS(handlePaintEnd)();
    });
  /* eslint-enable react-hooks/refs */

  function startEdit(item: GanttItem) {
    setEditingId(item.id);
    setEditValue(item.name);
  }

  function commitEdit() {
    if (!editingId) return;
    onUpdateName(editingId, editValue.trim() || "項目名");
    setEditingId(null);
  }

  function confirmRemove(item: GanttItem) {
    Alert.alert("項目の削除", `「${item.name}」を削除しますか？`, [
      { text: "キャンセル", style: "cancel" },
      { text: "削除", style: "destructive", onPress: () => onRemoveItem(item.id) },
    ]);
  }

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>項目がありません。「項目を追加」から追加してください。</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <ScrollView scrollEnabled={!isDragging} nestedScrollEnabled>
        <View style={styles.row}>
          {/* 項目名列（固定・横スクロールしない） */}
          <View style={{ width: NAME_COL_WIDTH_MOBILE }}>
            <View style={{ height: HEADER_HEIGHT }} />
            {items.map((item) => (
              <View key={item.id} style={{ height: CELL_HEIGHT_MOBILE * 2 }}>
                <View style={styles.nameRow}>
                  {editingId === item.id ? (
                    <View style={styles.nameEditRow}>
                      <TextInput
                        autoFocus
                        value={editValue}
                        onChangeText={setEditValue}
                        onSubmitEditing={commitEdit}
                        onBlur={commitEdit}
                        style={styles.nameInput}
                      />
                      <Pressable onPress={commitEdit} hitSlop={8}>
                        <Check size={14} color="#10b981" />
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.nameText} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <View style={styles.nameActions}>
                        <Pressable onPress={() => startEdit(item)} hitSlop={6}>
                          <Pencil size={12} color="#9ca3af" />
                        </Pressable>
                        <Pressable onPress={() => confirmRemove(item)} hitSlop={6}>
                          <Trash2 size={12} color="#9ca3af" />
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
                <View style={styles.labelRow}>
                  <View style={[styles.labelCell, styles.planLabelCell]}>
                    <Text style={styles.labelTextPlan}>計</Text>
                  </View>
                  <View style={[styles.labelCell, styles.actualLabelCell]}>
                    <Text style={styles.labelTextActual}>実</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* ヘッダー + グリッド（横スクロール） */}
          <ScrollView horizontal scrollEnabled={!isDragging} nestedScrollEnabled>
            <View>
              <GanttHeader
                monthInfos={monthInfos}
                columns={columns}
                collapsedMonths={collapsedMonths}
                onToggleMonth={toggleMonth}
                width={gridWidth}
              />
              <GestureDetector gesture={panGesture}>
                <View style={{ width: gridWidth, height: gridHeight }}>
                  <Svg width={gridWidth} height={gridHeight}>
                    {items.map((item, itemIndex) => (
                      <GanttRow
                        key={item.id}
                        item={item}
                        itemIndex={itemIndex}
                        columns={columns}
                        targetDate={targetDate ?? null}
                        cellHeight={CELL_HEIGHT_MOBILE}
                        showBottomBorder={itemIndex < items.length - 1}
                      />
                    ))}
                  </Svg>
                </View>
              </GestureDetector>
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
  },
  emptyContainer: {
    paddingVertical: 64,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    height: CELL_HEIGHT_MOBILE,
  },
  nameEditRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  nameInput: {
    flex: 1,
    fontSize: 11,
    borderWidth: 1,
    borderColor: "#a5b4fc",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  nameText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    color: "#1f2937",
  },
  nameActions: {
    flexDirection: "row",
    gap: 4,
  },
  labelRow: {
    flexDirection: "row",
    height: CELL_HEIGHT_MOBILE,
    borderTopWidth: 1,
    borderColor: "#f3f4f6",
  },
  labelCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  planLabelCell: {
    backgroundColor: "#eef2ff",
    borderRightWidth: 1,
    borderColor: "#f3f4f6",
  },
  actualLabelCell: {
    backgroundColor: "#ecfdf5",
  },
  labelTextPlan: {
    fontSize: 9,
    fontWeight: "600",
    color: "#4f46e5",
  },
  labelTextActual: {
    fontSize: 9,
    fontWeight: "600",
    color: "#059669",
  },
});
