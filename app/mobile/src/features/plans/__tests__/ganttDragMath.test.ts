import { computeDragDiff, getDatesBetween } from "../ganttDragMath";

const DATES = ["2026-01-01", "2026-01-02", "2026-01-03", "2026-01-04", "2026-01-05"];

describe("getDatesBetween", () => {
  it("前後どちらの順でも範囲を返す", () => {
    expect(getDatesBetween(DATES, "2026-01-02", "2026-01-04")).toEqual([
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
    expect(getDatesBetween(DATES, "2026-01-04", "2026-01-02")).toEqual([
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
  });

  it("同じ日付なら1件だけ返す", () => {
    expect(getDatesBetween(DATES, "2026-01-03", "2026-01-03")).toEqual(["2026-01-03"]);
  });

  it("存在しない日付なら空配列を返す", () => {
    expect(getDatesBetween(DATES, "2026-02-01", "2026-01-03")).toEqual([]);
  });
});

describe("computeDragDiff", () => {
  it("前方へドラッグを伸ばすとtoApplyが増える", () => {
    const diff = computeDragDiff(DATES, "2026-01-02", "2026-01-02", "2026-01-04");
    expect(diff.toApply).toEqual(["2026-01-03", "2026-01-04"]);
    expect(diff.toUndo).toEqual([]);
  });

  it("ドラッグを戻すとtoUndoが発生する", () => {
    const diff = computeDragDiff(DATES, "2026-01-02", "2026-01-04", "2026-01-03");
    expect(diff.toApply).toEqual([]);
    expect(diff.toUndo).toEqual(["2026-01-04"]);
  });

  it("開始位置を越えて逆方向にドラッグすると範囲が反転する", () => {
    const diff = computeDragDiff(DATES, "2026-01-03", "2026-01-03", "2026-01-01");
    expect(diff.toApply.sort()).toEqual(["2026-01-01", "2026-01-02"]);
    expect(diff.toUndo).toEqual([]);
  });

  it("同じ日に留まれば差分は発生しない", () => {
    const diff = computeDragDiff(DATES, "2026-01-02", "2026-01-02", "2026-01-02");
    expect(diff.toApply).toEqual([]);
    expect(diff.toUndo).toEqual([]);
  });
});
