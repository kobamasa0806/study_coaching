import { calcDuration, formatMinutes, timeToMinutes, toDateInputString, toTimeString, trimSeconds } from "../duration";

describe("timeToMinutes", () => {
  it("HH:MM を分に変換する", () => {
    expect(timeToMinutes("00:00")).toBe(0);
    expect(timeToMinutes("14:30")).toBe(870);
    expect(timeToMinutes("23:59")).toBe(1439);
  });

  it("不正な形式はnull", () => {
    expect(timeToMinutes("")).toBeNull();
    expect(timeToMinutes("24:00")).toBeNull();
    expect(timeToMinutes("12:60")).toBeNull();
    expect(timeToMinutes("abc")).toBeNull();
  });
});

describe("calcDuration", () => {
  it("通常の勉強時間を計算する", () => {
    expect(calcDuration("14:30", "16:00")).toBe(90);
  });

  it("日跨ぎは翌日扱いで計算する", () => {
    expect(calcDuration("23:00", "01:00")).toBe(120);
  });

  it("同時刻は無効(null)", () => {
    expect(calcDuration("10:00", "10:00")).toBeNull();
  });

  it("不正な時刻はnull", () => {
    expect(calcDuration("", "10:00")).toBeNull();
    expect(calcDuration("10:00", "")).toBeNull();
  });
});

describe("formatMinutes", () => {
  it("時間と分を組み合わせて整形する", () => {
    expect(formatMinutes(90)).toBe("1時間30分");
    expect(formatMinutes(60)).toBe("1時間");
    expect(formatMinutes(30)).toBe("30分");
    expect(formatMinutes(0)).toBe("0分");
  });
});

describe("trimSeconds", () => {
  it("秒を切り詰める", () => {
    expect(trimSeconds("14:30:00")).toBe("14:30");
    expect(trimSeconds("14:30")).toBe("14:30");
  });
});

describe("toTimeString / toDateInputString", () => {
  it("Dateを送信用文字列に整形する", () => {
    const d = new Date(2026, 0, 5, 9, 5); // 2026-01-05 09:05
    expect(toTimeString(d)).toBe("09:05");
    expect(toDateInputString(d)).toBe("2026-01-05");
  });
});
