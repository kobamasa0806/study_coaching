import { buildMonthInfos } from "../ganttDate";
import { buildGridColumns, columnAtX, gridTotalWidth, rowAtY } from "../ganttGeometry";

function makeDates(strs: string[]): Date[] {
  return strs.map((s) => new Date(`${s}T00:00:00`));
}

describe("buildGridColumns / columnAtX", () => {
  it("展開中の月は日付ごとに個別の列になる", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02", "2026-01-03"]));
    const columns = buildGridColumns(monthInfos, new Set(), 30);

    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual({ x: 0, width: 30, dateStr: "2026-01-01" });
    expect(columns[1]).toEqual({ x: 30, width: 30, dateStr: "2026-01-02" });
    expect(columns[2]).toEqual({ x: 60, width: 30, dateStr: "2026-01-03" });
  });

  it("折りたたみ中の月は1列にまとまり、日付を持たない", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02", "2026-02-01"]));
    const columns = buildGridColumns(monthInfos, new Set(["2026-01"]), 30, 22);

    expect(columns).toHaveLength(2);
    expect(columns[0]).toEqual({ x: 0, width: 22, dateStr: null });
    expect(columns[1]).toEqual({ x: 22, width: 30, dateStr: "2026-02-01" });
  });

  it("columnAtXは該当する列を返す", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02"]));
    const columns = buildGridColumns(monthInfos, new Set(), 30);

    expect(columnAtX(columns, 0)?.dateStr).toBe("2026-01-01");
    expect(columnAtX(columns, 29)?.dateStr).toBe("2026-01-01");
    expect(columnAtX(columns, 30)?.dateStr).toBe("2026-01-02");
    expect(columnAtX(columns, 59)?.dateStr).toBe("2026-01-02");
  });

  it("columnAtXは範囲外ならnullを返す", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01"]));
    const columns = buildGridColumns(monthInfos, new Set(), 30);

    expect(columnAtX(columns, -1)).toBeNull();
    expect(columnAtX(columns, 30)).toBeNull();
  });

  it("columnAtXは折りたたみ列（操作不可）ならnullを返す", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02"]));
    const columns = buildGridColumns(monthInfos, new Set(["2026-01"]), 30, 22);

    expect(columnAtX(columns, 10)).toBeNull();
  });

  it("gridTotalWidthは最後の列の右端を返す", () => {
    const monthInfos = buildMonthInfos(makeDates(["2026-01-01", "2026-01-02"]));
    const columns = buildGridColumns(monthInfos, new Set(), 30);
    expect(gridTotalWidth(columns)).toBe(60);
  });
});

describe("rowAtY", () => {
  it("計画行と実績行を交互に判定する", () => {
    expect(rowAtY(0, 22, 2)).toEqual({ itemIndex: 0, rowType: "plan" });
    expect(rowAtY(21, 22, 2)).toEqual({ itemIndex: 0, rowType: "plan" });
    expect(rowAtY(22, 22, 2)).toEqual({ itemIndex: 0, rowType: "actual" });
    expect(rowAtY(44, 22, 2)).toEqual({ itemIndex: 1, rowType: "plan" });
    expect(rowAtY(66, 22, 2)).toEqual({ itemIndex: 1, rowType: "actual" });
  });

  it("範囲外ならnullを返す", () => {
    expect(rowAtY(-1, 22, 2)).toBeNull();
    expect(rowAtY(88, 22, 2)).toBeNull();
  });
});
