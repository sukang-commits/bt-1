// 주간 수행도 = 완료된 필수 업무 수 ÷ 전체 필수 업무 수 × 100
export function calculateWeeklyPerformanceRate(completed: number, total: number): number {
  if (total <= 0) return 0;
  if (completed < 0 || completed > total) {
    throw new Error("completed는 0 이상 total 이하여야 합니다.");
  }
  return Math.round((completed / total) * 1000) / 10;
}

export const DAY_OF_WEEK_LABEL = ["월", "화", "수", "목", "금", "토", "일"] as const;

export interface DailyPerformancePoint {
  dayOfWeek: number; // 0=월 ... 6=일
  requiredTasksTotal: number;
  requiredTasksCompleted: number;
}

export interface WeeklyPerformanceSummary {
  dayOfWeek: number;
  dayLabel: string;
  rate: number;
}

export function summarizeWeeklyPerformance(days: DailyPerformancePoint[]): WeeklyPerformanceSummary[] {
  const byDay = new Map(days.map((d) => [d.dayOfWeek, d]));

  return DAY_OF_WEEK_LABEL.map((label, dayOfWeek) => {
    const point = byDay.get(dayOfWeek);
    const rate = point
      ? calculateWeeklyPerformanceRate(point.requiredTasksCompleted, point.requiredTasksTotal)
      : 0;
    return { dayOfWeek, dayLabel: label, rate };
  });
}

export function averageWeeklyPerformanceRate(days: DailyPerformancePoint[]): number {
  const validDays = days.filter((d) => d.requiredTasksTotal > 0);
  if (validDays.length === 0) return 0;
  const sum = validDays.reduce(
    (acc, d) => acc + calculateWeeklyPerformanceRate(d.requiredTasksCompleted, d.requiredTasksTotal),
    0
  );
  return Math.round((sum / validDays.length) * 10) / 10;
}
