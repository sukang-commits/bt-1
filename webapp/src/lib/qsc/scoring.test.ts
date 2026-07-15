import { describe, expect, it } from "vitest";
import { calculateCategoryAverage, calculateQscTotal, calculateTotalScore, totalScoreGrade } from "./scoring";

describe("calculateCategoryAverage", () => {
  it("세부 항목 점수의 평균을 낸다", () => {
    expect(calculateCategoryAverage([90, 80, 100, 70, 60])).toBe(80);
  });

  it("빈 배열이면 0을 반환한다", () => {
    expect(calculateCategoryAverage([])).toBe(0);
  });

  it("0~100 범위를 벗어나면 예외를 던진다", () => {
    expect(() => calculateCategoryAverage([101])).toThrow();
    expect(() => calculateCategoryAverage([-1])).toThrow();
  });
});

describe("calculateQscTotal", () => {
  it("Q/S/C 평균을 낸다", () => {
    expect(calculateQscTotal(90, 80, 70)).toBe(80);
  });
});

describe("calculateTotalScore", () => {
  it("QSC*0.6 + 월달성률*0.4 로 계산한다", () => {
    expect(calculateTotalScore(90, 80)).toBe(86);
    expect(calculateTotalScore(100, 100)).toBe(100);
  });
});

describe("totalScoreGrade", () => {
  it("점수 구간별로 등급을 매긴다", () => {
    expect(totalScoreGrade(96)).toBe("최우수");
    expect(totalScoreGrade(95)).toBe("최우수");
    expect(totalScoreGrade(94.99)).toBe("우수");
    expect(totalScoreGrade(90)).toBe("우수");
    expect(totalScoreGrade(85)).toBe("정상");
    expect(totalScoreGrade(75)).toBe("개선필요");
    expect(totalScoreGrade(50)).toBe("집중관리");
  });
});
