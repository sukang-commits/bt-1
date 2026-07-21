import { describe, expect, it } from "vitest";
import {
  calculateMonthlyAchievementRate,
  calculatePreviousPeriodDiff,
  previousYearMonth,
} from "./monthly";

describe("calculateMonthlyAchievementRate", () => {
  it("가중치(50/20/10/10/10)대로 합산한다", () => {
    const rate = calculateMonthlyAchievementRate({
      weeklyPerformanceRate: 100,
      settlementRate: 100,
      noticeAckRate: 100,
      breakAuthRate: 100,
      taskCompletionScore: 100,
    });
    expect(rate).toBe(100);
  });

  it("각 항목이 다르면 가중 평균으로 계산된다", () => {
    const rate = calculateMonthlyAchievementRate({
      weeklyPerformanceRate: 90, // *0.5 = 45
      settlementRate: 80, // *0.2 = 16
      noticeAckRate: 70, // *0.1 = 7
      breakAuthRate: 60, // *0.1 = 6
      taskCompletionScore: 50, // *0.1 = 5
    });
    expect(rate).toBe(79);
  });

  it("0~100 범위를 벗어나면 예외를 던진다", () => {
    expect(() =>
      calculateMonthlyAchievementRate({
        weeklyPerformanceRate: 101,
        settlementRate: 0,
        noticeAckRate: 0,
        breakAuthRate: 0,
        taskCompletionScore: 0,
      })
    ).toThrow();
  });
});

describe("calculatePreviousPeriodDiff", () => {
  it("이전 값이 없으면 null을 반환한다", () => {
    expect(calculatePreviousPeriodDiff(80, null)).toBeNull();
  });

  it("증감을 소수 첫째자리까지 계산한다", () => {
    expect(calculatePreviousPeriodDiff(85.5, 82)).toBe(3.5);
    expect(calculatePreviousPeriodDiff(70, 88)).toBe(-18);
  });
});

describe("previousYearMonth", () => {
  it("월이 바뀌는 경우를 올바르게 처리한다", () => {
    expect(previousYearMonth("2026-07")).toBe("2026-06");
    expect(previousYearMonth("2026-01")).toBe("2025-12");
  });
});
