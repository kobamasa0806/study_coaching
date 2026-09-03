/**
 * ガントチャートの日付グルーピング（年・月）ロジック（純粋関数）。
 * Web版 (GanttChart.tsx の buildMonthInfos / buildYearGroups) の移植。
 */
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export type MonthInfo = {
  key: string; // "yyyy-MM" 形式（折りたたみの識別子）
  monthLabel: string; // 表示用月ラベル（例: "3月"）
  yearLabel: string; // 表示用年ラベル（例: "2026年"）
  dates: Date[];
};

export type YearGroup = {
  label: string;
  months: MonthInfo[];
};

export function toDateStr(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function weekdayLabel(date: Date): string {
  return format(date, "E", { locale: ja });
}

export function dayOfMonthLabel(date: Date): string {
  return format(date, "d");
}

/** 日付配列から月ごとの情報を構築する。 */
export function buildMonthInfos(dates: Date[]): MonthInfo[] {
  const map = new Map<string, MonthInfo>();
  for (const date of dates) {
    const key = format(date, "yyyy-MM");
    if (!map.has(key)) {
      map.set(key, {
        key,
        monthLabel: format(date, "M月"),
        yearLabel: format(date, "yyyy年"),
        dates: [],
      });
    }
    map.get(key)!.dates.push(date);
  }
  return Array.from(map.values());
}

/** 月情報を年でグループ化する（同じ年が連続する場合は1つのグループにまとめる）。 */
export function buildYearGroups(monthInfos: MonthInfo[]): YearGroup[] {
  const groups: YearGroup[] = [];
  for (const m of monthInfos) {
    const last = groups[groups.length - 1];
    if (last && last.label === m.yearLabel) {
      last.months.push(m);
    } else {
      groups.push({ label: m.yearLabel, months: [m] });
    }
  }
  return groups;
}
