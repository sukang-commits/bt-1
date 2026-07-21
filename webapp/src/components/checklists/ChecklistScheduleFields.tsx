"use client";

import { DAY_OF_WEEK_LABEL, WEEK_OF_MONTH_LABEL } from "@/lib/checklists/schedule";
import type { ChecklistTypeEnum } from "@/types/database";

// weekly/monthly 타입일 때만 "몇째 주 무슨 요일"을 지정하는 필드를 보여줍니다.
// 그 외 타입(오픈/마감 등)은 매일 노출되는 게 맞으므로 아무것도 렌더링하지 않습니다.
export function ChecklistScheduleFields({
  type,
  dayOfWeek,
  weekOfMonth,
  onDayOfWeekChange,
  onWeekOfMonthChange,
}: {
  type: ChecklistTypeEnum;
  dayOfWeek: number | null;
  weekOfMonth: number | null;
  onDayOfWeekChange: (value: number | null) => void;
  onWeekOfMonthChange: (value: number | null) => void;
}) {
  if (type !== "weekly" && type !== "monthly") return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-page p-3">
      <p className="text-sm font-medium text-ink">
        {type === "weekly" ? "매주 어느 요일에 노출할까요?" : "매월 몇째 주 어느 요일에 노출할까요?"}
      </p>

      {type === "monthly" && (
        <select
          className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-ink"
          value={weekOfMonth ?? ""}
          onChange={(e) => onWeekOfMonthChange(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">주차 선택 (선택 안 하면 매일 노출)</option>
          {Object.entries(WEEK_OF_MONTH_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      )}

      <select
        className="h-11 w-full rounded-xl border border-border bg-surface px-3 text-ink"
        value={dayOfWeek ?? ""}
        onChange={(e) => onDayOfWeekChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">요일 선택 (선택 안 하면 매일 노출)</option>
        {Object.entries(DAY_OF_WEEK_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
