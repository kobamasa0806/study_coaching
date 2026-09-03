import { getActualCellColor, getPlanCellColor } from "../ganttCellColor";

describe("getPlanCellColor", () => {
  it("塗り済みが最優先される", () => {
    const color = getPlanCellColor({
      filled: true,
      isTargetDate: true,
      isToday: true,
      isWeekend: true,
    });
    expect(color).toBe("#6366f1");
  });

  it("未塗りなら目標日が優先される", () => {
    const color = getPlanCellColor({
      filled: false,
      isTargetDate: true,
      isToday: true,
      isWeekend: true,
    });
    expect(color).toBe("#fdba74");
  });

  it("目標日でなければ今日が優先される", () => {
    const color = getPlanCellColor({
      filled: false,
      isTargetDate: false,
      isToday: true,
      isWeekend: true,
    });
    expect(color).toBe("#eef2ff");
  });

  it("今日でも目標日でもなければ週末色になる", () => {
    const color = getPlanCellColor({
      filled: false,
      isTargetDate: false,
      isToday: false,
      isWeekend: true,
    });
    expect(color).toBe("#f9fafb");
  });

  it("何にも該当しなければ白になる", () => {
    const color = getPlanCellColor({
      filled: false,
      isTargetDate: false,
      isToday: false,
      isWeekend: false,
    });
    expect(color).toBe("#ffffff");
  });
});

describe("getActualCellColor", () => {
  it("塗り済みは緑になる", () => {
    expect(
      getActualCellColor({ filled: true, isTargetDate: false, isToday: false, isWeekend: false })
    ).toBe("#10b981");
  });

  it("優先順位は計画行と同じ(塗り済み>目標日>今日>週末)", () => {
    expect(
      getActualCellColor({ filled: false, isTargetDate: true, isToday: true, isWeekend: true })
    ).toBe("#fdba74");
    expect(
      getActualCellColor({ filled: false, isTargetDate: false, isToday: true, isWeekend: true })
    ).toBe("#ecfdf5");
    expect(
      getActualCellColor({ filled: false, isTargetDate: false, isToday: false, isWeekend: true })
    ).toBe("#f9fafb");
  });
});
