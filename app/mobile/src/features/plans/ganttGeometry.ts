/**
 * ガントチャートのジオメトリ計算（純粋関数）。
 * RNには DOM の document.elementFromPoint に相当するAPIが無いため、
 * ジェスチャーのタッチ座標（グリッド全体コンテンツ内でのローカル座標）を
 * 列インデックス（日付）・行インデックス（項目・計画/実績）に変換する。
 *
 * 折りたたみ中の月は1列（COLLAPSED_CELL_WIDTH幅）にまとまり、個々の日付には
 * 分解されず、タップ操作の対象にもならない（Web版と同じ仕様）。
 */
import type { MonthInfo } from "./ganttDate";
import { toDateStr } from "./ganttDate";

export const CELL_WIDTH = 30;
export const COLLAPSED_CELL_WIDTH = 22;
export const CELL_HEIGHT = 22;
export const CELL_WIDTH_MOBILE = 20;
export const CELL_HEIGHT_MOBILE = 24;
export const NAME_COL_WIDTH = 210;
export const NAME_COL_WIDTH_MOBILE = 96;

/** グリッド上の1列を表す。dateStr が null の列は折りたたまれた月のプレースホルダーで操作不可。 */
export type GridColumn = {
  x: number; // このグリッド内でのローカルな左端オフセット（px）
  width: number;
  dateStr: string | null;
};

/** 月情報・折りたたみ状態から、グリッドの列レイアウト（累積オフセット付き）を構築する。 */
export function buildGridColumns(
  monthInfos: MonthInfo[],
  collapsedMonths: ReadonlySet<string>,
  cellWidth: number,
  collapsedCellWidth: number = COLLAPSED_CELL_WIDTH
): GridColumn[] {
  const columns: GridColumn[] = [];
  let x = 0;
  for (const m of monthInfos) {
    if (collapsedMonths.has(m.key)) {
      columns.push({ x, width: collapsedCellWidth, dateStr: null });
      x += collapsedCellWidth;
    } else {
      for (const date of m.dates) {
        columns.push({ x, width: cellWidth, dateStr: toDateStr(date) });
        x += cellWidth;
      }
    }
  }
  return columns;
}

export function gridTotalWidth(columns: GridColumn[]): number {
  const last = columns[columns.length - 1];
  return last ? last.x + last.width : 0;
}

/** ローカルX座標から列を求める。範囲外・折りたたみ列（操作不可）なら null。 */
export function columnAtX(columns: GridColumn[], x: number): GridColumn | null {
  if (x < 0) return null;
  for (const col of columns) {
    if (x >= col.x && x < col.x + col.width) {
      return col.dateStr === null ? null : col;
    }
  }
  return null;
}

export type MonthBlock = {
  key: string;
  monthLabel: string;
  yearLabel: string;
  collapsed: boolean;
  x: number;
  width: number;
};

/**
 * 月ごとのヘッダー表示ブロック（x座標・幅）を計算する。
 * columns は buildGridColumns(monthInfos, collapsedMonths, ...) の結果を渡すこと
 * （monthInfos と1対1で対応している前提で、折りたたみ月は列を1つ、展開中の月は
 * dates.length 個の列を順に消費する）。
 */
export function computeMonthBlocks(
  monthInfos: readonly { key: string; monthLabel: string; yearLabel: string; dates: Date[] }[],
  columns: GridColumn[],
  collapsedMonths: ReadonlySet<string>
): MonthBlock[] {
  const blocks: MonthBlock[] = [];
  let colIndex = 0;
  for (const m of monthInfos) {
    const collapsed = collapsedMonths.has(m.key);
    const consumed = collapsed ? 1 : m.dates.length;
    const first = columns[colIndex];
    const last = columns[colIndex + consumed - 1];
    if (first && last) {
      blocks.push({
        key: m.key,
        monthLabel: m.monthLabel,
        yearLabel: m.yearLabel,
        collapsed,
        x: first.x,
        width: last.x + last.width - first.x,
      });
    }
    colIndex += consumed;
  }
  return blocks;
}

export type RowInfo = {
  itemIndex: number;
  rowType: "plan" | "actual";
};

/**
 * ローカルY座標（グリッド本体の先頭を0とする）から、対象項目のインデックスと
 * 計画/実績どちらの行かを求める。各項目は計画行→実績行の2行、それぞれ cellHeight。
 */
export function rowAtY(y: number, cellHeight: number, itemCount: number): RowInfo | null {
  if (y < 0 || cellHeight <= 0) return null;
  const rowIndex = Math.floor(y / cellHeight);
  const itemIndex = Math.floor(rowIndex / 2);
  if (itemIndex < 0 || itemIndex >= itemCount) return null;
  const rowType: "plan" | "actual" = rowIndex % 2 === 0 ? "plan" : "actual";
  return { itemIndex, rowType };
}
