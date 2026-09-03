/**
 * ガントチャートのドラッグ塗りロジック（DOM非依存の純粋関数）。
 * Web版 (GanttChart.tsx の getDatesBetween / handleMouseOver 内の差分計算) の移植。
 * ドラッグ開始位置から現在位置までの範囲を求め、直前の範囲との差分（新たに塗る日付・
 * 元に戻す日付）だけを返すことで、ドラッグ中の onToggleDates 呼び出しをバッチ化する。
 */

/** from〜to の間にある日付文字列の配列を返す（allDateStrs 内のインデックスを使って範囲を計算する） */
export function getDatesBetween(allDateStrs: string[], from: string, to: string): string[] {
  const a = allDateStrs.indexOf(from);
  const b = allDateStrs.indexOf(to);
  if (a === -1 || b === -1) return [];
  const [lo, hi] = a <= b ? [a, b] : [b, a];
  return allDateStrs.slice(lo, hi + 1);
}

export type DragDiff = {
  /** 新たに塗る（またはfalseなら消す）べき日付 */
  toApply: string[];
  /** 直前の範囲から外れたため、逆の操作に戻すべき日付 */
  toUndo: string[];
};

/**
 * ドラッグ開始日から「直前にホバーしていた日」「現在ホバーしている日」までの
 * 範囲を比較し、差分だけを返す。
 */
export function computeDragDiff(
  allDateStrs: string[],
  startDate: string,
  prevDate: string,
  nextDate: string
): DragDiff {
  const prevSet = new Set(getDatesBetween(allDateStrs, startDate, prevDate));
  const nextSet = new Set(getDatesBetween(allDateStrs, startDate, nextDate));

  const toApply = [...nextSet].filter((d) => !prevSet.has(d));
  const toUndo = [...prevSet].filter((d) => !nextSet.has(d));

  return { toApply, toUndo };
}
