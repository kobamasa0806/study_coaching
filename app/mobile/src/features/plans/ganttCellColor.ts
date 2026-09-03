/**
 * ガントチャートのセル色決定ロジック（DOM非依存の純粋関数）。
 * Web版 (GanttChart.tsx の計画行・実績行のセル背景色分岐) の移植。
 * TailwindのクラスではなくSVGのfillに直接使えるhex文字列を返す。
 */

export type CellColorInput = {
  filled: boolean;
  isTargetDate: boolean;
  isToday: boolean;
  isWeekend: boolean;
};

const COLOR = {
  indigo500: "#6366f1",
  indigo50: "#eef2ff",
  orange300: "#fdba74",
  gray50: "#f9fafb",
  emerald500: "#10b981",
  emerald50: "#ecfdf5",
  white: "#ffffff",
} as const;

/** 計画行のセル色（優先順位: 塗り済み > 目標日 > 今日 > 週末 > 平日） */
export function getPlanCellColor(input: CellColorInput): string {
  if (input.filled) return COLOR.indigo500;
  if (input.isTargetDate) return COLOR.orange300;
  if (input.isToday) return COLOR.indigo50;
  if (input.isWeekend) return COLOR.gray50;
  return COLOR.white;
}

/** 実績行のセル色（優先順位: 塗り済み > 目標日 > 今日 > 週末 > 平日） */
export function getActualCellColor(input: CellColorInput): string {
  if (input.filled) return COLOR.emerald500;
  if (input.isTargetDate) return COLOR.orange300;
  if (input.isToday) return COLOR.emerald50;
  if (input.isWeekend) return COLOR.gray50;
  return COLOR.white;
}
