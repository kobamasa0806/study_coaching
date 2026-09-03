import { buildMonthInfos } from "../ganttDate";
import { buildGridColumns, computeMonthBlocks } from "../ganttGeometry";

function makeDates(strs: string[]): Date[] {
  return strs.map((s) => new Date(`${s}T00:00:00`));
}

describe("computeMonthBlocks", () => {
  it("展開中の月は日数分の幅を合計する", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02", "2026-01-03"]));
    const columns = buildGridColumns(monthInfos, new Set(), 30);
    const blocks = computeMonthBlocks(monthInfos, columns, new Set());

    expect(blocks).toEqual([{ key: "2026-01", monthLabel: "1月", yearLabel: "2026年", collapsed: false, x: 0, width: 90 }]);
  });

  it("折りたたみ中の月は1列分の幅になる", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02", "2026-02-01"]));
    const columns = buildGridColumns(monthInfos, new Set(["2026-01"]), 30, 22);
    const blocks = computeMonthBlocks(monthInfos, columns, new Set(["2026-01"]));

    expect(blocks).toEqual([
      { key: "2026-01", monthLabel: "1月", yearLabel: "2026年", collapsed: true, x: 0, width: 22 },
      { key: "2026-02", monthLabel: "2月", yearLabel: "2026年", collapsed: false, x: 22, width: 30 },
    ]);
  });
});
