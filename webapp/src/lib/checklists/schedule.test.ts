import { describe, expect, it } from "vitest";
import { isChecklistDueOn, isMonthlyChecklistDueOn, isWeeklyChecklistDueOn } from "./schedule";

// 2026년 7월: 수요일(3)은 1,8,15,22,29일 (5번 있음), 일요일(0)은 5,12,19,26일 (4번뿐)

describe("isWeeklyChecklistDueOn", () => {
  it("지정한 요일이면 true", () => {
    expect(isWeeklyChecklistDueOn("2026-07-08", 3)).toBe(true); // 수요일
  });

  it("다른 요일이면 false", () => {
    expect(isWeeklyChecklistDueOn("2026-07-08", 1)).toBe(false);
  });
});

describe("isMonthlyChecklistDueOn", () => {
  it("N번째 요일을 정확히 계산한다", () => {
    expect(isMonthlyChecklistDueOn("2026-07-01", 3, 1)).toBe(true); // 첫째 주 수요일
    expect(isMonthlyChecklistDueOn("2026-07-08", 3, 2)).toBe(true); // 둘째 주 수요일
    expect(isMonthlyChecklistDueOn("2026-07-15", 3, 3)).toBe(true); // 셋째 주 수요일
    expect(isMonthlyChecklistDueOn("2026-07-15", 2, 3)).toBe(false); // 요일 자체가 다름
  });

  it("weekOfMonth=5(마지막 주)는 그 달의 실제 마지막 발생일과 일치한다", () => {
    // 7월 수요일은 5번 있으므로 29일이 마지막(=5번째와 동일)
    expect(isMonthlyChecklistDueOn("2026-07-29", 3, 5)).toBe(true);
    expect(isMonthlyChecklistDueOn("2026-07-22", 3, 5)).toBe(false);
  });

  it("그 달에 5번째 발생일이 없는 요일도 마지막 발생일을 정확히 찾는다", () => {
    // 7월 일요일은 4번뿐(5,12,19,26) — 26일이 마지막
    expect(isMonthlyChecklistDueOn("2026-07-26", 0, 5)).toBe(true);
    expect(isMonthlyChecklistDueOn("2026-07-19", 0, 5)).toBe(false);
  });
});

describe("isChecklistDueOn", () => {
  it("weekly/monthly가 아니면 항상 true (오픈/마감 등 매일 체크리스트)", () => {
    expect(isChecklistDueOn("2026-07-08", "open", null, null)).toBe(true);
    expect(isChecklistDueOn("2026-07-08", "close", 2, 3)).toBe(true);
  });

  it("weekly인데 일정이 비어있으면(하위 호환) 항상 true", () => {
    expect(isChecklistDueOn("2026-07-08", "weekly", null, null)).toBe(true);
  });

  it("weekly는 지정한 요일에만 true", () => {
    expect(isChecklistDueOn("2026-07-08", "weekly", 3, null)).toBe(true);
    expect(isChecklistDueOn("2026-07-09", "weekly", 3, null)).toBe(false);
  });

  it("monthly는 요일+주차가 모두 일치해야 true", () => {
    expect(isChecklistDueOn("2026-07-15", "monthly", 3, 3)).toBe(true);
    expect(isChecklistDueOn("2026-07-08", "monthly", 3, 3)).toBe(false);
  });

  it("monthly인데 일정 중 하나라도 비어있으면(하위 호환) 항상 true", () => {
    expect(isChecklistDueOn("2026-07-08", "monthly", 3, null)).toBe(true);
    expect(isChecklistDueOn("2026-07-08", "monthly", null, 3)).toBe(true);
  });
});
