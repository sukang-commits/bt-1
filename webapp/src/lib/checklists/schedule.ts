import type { ChecklistTypeEnum } from "@/types/database";

// 0=일요일 ... 6=토요일 (JS Date의 getDay()/getUTCDay()와 동일한 규칙)
export const DAY_OF_WEEK_LABEL: Record<number, string> = {
  0: "일요일",
  1: "월요일",
  2: "화요일",
  3: "수요일",
  4: "목요일",
  5: "금요일",
  6: "토요일",
};

// 5는 "그 달의 마지막 요일 주"를 의미합니다 (모든 달이 5번째 주를 갖진 않으므로).
export const WEEK_OF_MONTH_LABEL: Record<number, string> = {
  1: "첫째 주",
  2: "둘째 주",
  3: "셋째 주",
  4: "넷째 주",
  5: "마지막 주",
};

function parseUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00Z`);
}

export function isWeeklyChecklistDueOn(dateStr: string, dayOfWeek: number): boolean {
  return parseUtcDate(dateStr).getUTCDay() === dayOfWeek;
}

export function isMonthlyChecklistDueOn(dateStr: string, dayOfWeek: number, weekOfMonth: number): boolean {
  const date = parseUtcDate(dateStr);
  if (date.getUTCDay() !== dayOfWeek) return false;

  if (weekOfMonth === 5) {
    // "마지막 주" — 7일 뒤에도 같은 달이면 아직 마지막이 아님
    const next = new Date(date);
    next.setUTCDate(date.getUTCDate() + 7);
    return next.getUTCMonth() !== date.getUTCMonth();
  }

  return Math.ceil(date.getUTCDate() / 7) === weekOfMonth;
}

// 체크리스트 템플릿이 해당 날짜에 노출/제출 대상인지 판단합니다.
// weekly/monthly가 아니거나 일정이 설정되지 않았으면 항상 노출됩니다 (하위 호환).
export function isChecklistDueOn(
  dateStr: string,
  type: ChecklistTypeEnum,
  scheduleDayOfWeek: number | null,
  scheduleWeekOfMonth: number | null
): boolean {
  if (type === "weekly") {
    return scheduleDayOfWeek === null ? true : isWeeklyChecklistDueOn(dateStr, scheduleDayOfWeek);
  }
  if (type === "monthly") {
    if (scheduleDayOfWeek === null || scheduleWeekOfMonth === null) return true;
    return isMonthlyChecklistDueOn(dateStr, scheduleDayOfWeek, scheduleWeekOfMonth);
  }
  return true;
}
