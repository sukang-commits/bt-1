// 월간 달성률 가중치
//   주간 업무 수행도 50% + 정산 인증 완료율 20% + 공지 확인율 10%
//   + 휴게시간 인증률 10% + 업무 누락 및 보완 점수 10%
export const MONTHLY_ACHIEVEMENT_WEIGHTS = {
  weeklyPerformanceRate: 0.5,
  settlementRate: 0.2,
  noticeAckRate: 0.1,
  breakAuthRate: 0.1,
  taskCompletionScore: 0.1,
} as const;

export interface MonthlyAchievementInputs {
  weeklyPerformanceRate: number;
  settlementRate: number;
  noticeAckRate: number;
  breakAuthRate: number;
  taskCompletionScore: number;
}

function assertPercentage(name: string, value: number) {
  if (value < 0 || value > 100) {
    throw new Error(`${name}는 0~100 사이여야 합니다. (받은 값: ${value})`);
  }
}

export function calculateMonthlyAchievementRate(inputs: MonthlyAchievementInputs): number {
  assertPercentage("weeklyPerformanceRate", inputs.weeklyPerformanceRate);
  assertPercentage("settlementRate", inputs.settlementRate);
  assertPercentage("noticeAckRate", inputs.noticeAckRate);
  assertPercentage("breakAuthRate", inputs.breakAuthRate);
  assertPercentage("taskCompletionScore", inputs.taskCompletionScore);

  const weighted =
    inputs.weeklyPerformanceRate * MONTHLY_ACHIEVEMENT_WEIGHTS.weeklyPerformanceRate +
    inputs.settlementRate * MONTHLY_ACHIEVEMENT_WEIGHTS.settlementRate +
    inputs.noticeAckRate * MONTHLY_ACHIEVEMENT_WEIGHTS.noticeAckRate +
    inputs.breakAuthRate * MONTHLY_ACHIEVEMENT_WEIGHTS.breakAuthRate +
    inputs.taskCompletionScore * MONTHLY_ACHIEVEMENT_WEIGHTS.taskCompletionScore;

  return Math.round(weighted * 10) / 10;
}

export function calculatePreviousPeriodDiff(current: number, previous: number | null): number | null {
  if (previous === null) return null;
  return Math.round((current - previous) * 10) / 10;
}

// year_month 문자열("2026-07")을 전월 문자열로 변환합니다.
export function previousYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}
