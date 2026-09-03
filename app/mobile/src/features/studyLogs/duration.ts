/**
 * 勉強記録の時間計算ロジック（純粋関数）。
 * Web版 (StudyLogPanel.tsx) の移植。
 */

/** 分数を「X時間Y分」表記に整形する */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

/** "HH:MM" 文字列を 0時からの経過分数に変換する（不正なら null） */
export function timeToMinutes(value: string): number | null {
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

/** 開始・終了から勉強分数を計算する（日跨ぎは翌日扱い・同時刻は null） */
export function calcDuration(start: string, end: string): number | null {
  const s = timeToMinutes(start);
  const e = timeToMinutes(end);
  if (s === null || e === null || s === e) return null;
  return e < s ? e + 24 * 60 - s : e - s;
}

/** "HH:MM:SS" や "HH:MM" を "HH:MM" に整形する */
export function trimSeconds(time: string): string {
  return time.slice(0, 5);
}

/** Date を "HH:MM" 形式の文字列に整形する（ピッカーの選択値を送信用にする） */
export function toTimeString(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/** Date を "yyyy-MM-dd" 形式の文字列に整形する */
export function toDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
