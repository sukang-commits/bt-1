import { describe, expect, it } from "vitest";
import {
  averageWeeklyPerformanceRate,
  calculateWeeklyPerformanceRate,
  summarizeWeeklyPerformance,
} from "./weekly";

describe("calculateWeeklyPerformanceRate", () => {
  it("완료/전체 비율을 퍼센트로 계산한다", () => {
    expect(calculateWeeklyPerformanceRate(9, 10)).toBe(90);
    expect(calculateWeeklyPerformanceRate(1, 3)).toBe(33.3);
  });

  it("전체가 0이면 0을 반환한다 (0으로 나누기 방지)", () => {
    expect(calculateWeeklyPerformanceRate(0, 0)).toBe(0);
  });

  it("completed가 total을 넘거나 음수면 예외를 던진다", () => {
    expect(() => calculateWeeklyPerformanceRate(11, 10)).toThrow();
    expect(() => calculateWeeklyPerformanceRate(-1, 10)).toThrow();
  });
});

describe("summarizeWeeklyPerformance", () => {
  it("데이터가 없는 요일은 0%로 채운다", () => {
    const result = summarizeWeeklyPerformance([
      { dayOfWeek: 0, requiredTasksTotal: 10, requiredTasksCompleted: 10 },
    ]);
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual({ dayOfWeek: 0, dayLabel: "월", rate: 100 });
    expect(result[1]).toEqual({ dayOfWeek: 1, dayLabel: "화", rate: 0 });
  });
});

describe("averageWeeklyPerformanceRate", () => {
  it("업무가 있었던 날짜만 평균에 반영한다", () => {
    const rate = averageWeeklyPerformanceRate([
      { dayOfWeek: 0, requiredTasksTotal: 10, requiredTasksCompleted: 10 }, // 100%
      { dayOfWeek: 1, requiredTasksTotal: 10, requiredTasksCompleted: 8 }, // 80%
      { dayOfWeek: 2, requiredTasksTotal: 0, requiredTasksCompleted: 0 }, // 휴무 -> 제외
    ]);
    expect(rate).toBe(90);
  });

  it("유효한 날짜가 하나도 없으면 0을 반환한다", () => {
    expect(averageWeeklyPerformanceRate([])).toBe(0);
  });
});
