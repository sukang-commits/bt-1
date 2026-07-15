"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getRequiredTaskCounts } from "@/lib/performance/queries";
import { getNoticeAckStats } from "@/lib/notices/queries";
import { averageWeeklyPerformanceRate } from "@/lib/performance/weekly";
import { calculateMonthlyAchievementRate, calculatePreviousPeriodDiff, previousYearMonth } from "@/lib/performance/monthly";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || !["senior_manager", "deputy_manager", "administrator"].includes(user.role)) {
    throw new Error("수행도 재계산은 관리자만 할 수 있습니다.");
  }
  return user;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function recomputeWeeklyPerformance(storeId: string, weekStartDate: string) {
  await assertAdmin();
  const supabase = await createServerSupabaseClient();

  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    const date = addDays(weekStartDate, dayOfWeek);
    const { total, completed } = await getRequiredTaskCounts(supabase, storeId, date);

    const { error } = await supabase
      .from("weekly_performance")
      .upsert(
        {
          store_id: storeId,
          profile_id: null,
          week_start_date: weekStartDate,
          day_of_week: dayOfWeek,
          required_tasks_total: total,
          required_tasks_completed: completed,
        },
        { onConflict: "store_id,week_start_date,day_of_week" }
      );
    if (error) throw error;
  }

  revalidatePath(`/admin/weekly-performance`);
  revalidatePath(`/stores/${storeId}/my-performance`);
}

export async function recomputeMonthlyAchievement(storeId: string, yearMonth: string) {
  await assertAdmin();
  const supabase = await createServerSupabaseClient();

  const monthStart = `${yearMonth}-01`;
  const [year, month] = yearMonth.split("-").map(Number);
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);

  const { data: weeklyRows } = await supabase
    .from("weekly_performance")
    .select("required_tasks_total, required_tasks_completed")
    .eq("store_id", storeId)
    .is("profile_id", null)
    .gte("week_start_date", monthStart)
    .lte("week_start_date", monthEnd);

  const weeklyPerformanceRate = averageWeeklyPerformanceRate(
    (weeklyRows ?? []).map((r) => ({
      dayOfWeek: 0,
      requiredTasksTotal: r.required_tasks_total,
      requiredTasksCompleted: r.required_tasks_completed,
    }))
  );

  const { data: settlements } = await supabase
    .from("settlements")
    .select("status")
    .eq("store_id", storeId)
    .gte("work_date", monthStart)
    .lte("work_date", monthEnd);
  const settlementRate =
    !settlements || settlements.length === 0
      ? 0
      : Math.round(
          (settlements.filter((s) => s.status !== "draft").length / settlements.length) * 1000
        ) / 10;

  const { data: notices } = await supabase
    .from("notices")
    .select("id, scope, store_id")
    .is("deleted_at", null)
    .gte("publish_at", `${monthStart}T00:00:00`)
    .lte("publish_at", `${monthEnd}T23:59:59`)
    .or(`store_id.eq.${storeId},scope.eq.all_stores`);
  const ackStatsList = await Promise.all((notices ?? []).map((n) => getNoticeAckStats(supabase, n)));
  const noticeAckRate =
    ackStatsList.length === 0
      ? 0
      : Math.round(
          (ackStatsList.reduce((sum, s) => sum + (s.targetCount === 0 ? 0 : s.ackCount / s.targetCount), 0) /
            ackStatsList.length) *
            1000
        ) / 10;

  const { data: breaks } = await supabase
    .from("breaks")
    .select("status")
    .eq("store_id", storeId)
    .gte("work_date", monthStart)
    .lte("work_date", monthEnd)
    .not("ended_at", "is", null);
  const breakAuthRate =
    !breaks || breaks.length === 0
      ? 0
      : Math.round((breaks.filter((b) => b.status === "completed").length / breaks.length) * 1000) / 10;

  const { data: checklistSubmissions } = await supabase
    .from("checklist_submissions")
    .select("progress_rate")
    .eq("store_id", storeId)
    .gte("work_date", monthStart)
    .lte("work_date", monthEnd);
  const taskCompletionScore =
    !checklistSubmissions || checklistSubmissions.length === 0
      ? 0
      : Math.round(
          (checklistSubmissions.reduce((sum, s) => sum + s.progress_rate, 0) / checklistSubmissions.length) * 10
        ) / 10;

  const achievementRate = calculateMonthlyAchievementRate({
    weeklyPerformanceRate,
    settlementRate,
    noticeAckRate,
    breakAuthRate,
    taskCompletionScore,
  });

  const prevYearMonth = previousYearMonth(yearMonth);
  const { data: prevRow } = await supabase
    .from("monthly_achievements")
    .select("achievement_rate")
    .eq("store_id", storeId)
    .eq("year_month", `${prevYearMonth}-01`)
    .maybeSingle();

  const previousMonthDiff = calculatePreviousPeriodDiff(achievementRate, prevRow?.achievement_rate ?? null);

  const { error } = await supabase.from("monthly_achievements").upsert(
    {
      store_id: storeId,
      year_month: monthStart,
      weekly_performance_rate: weeklyPerformanceRate,
      settlement_rate: settlementRate,
      notice_ack_rate: noticeAckRate,
      break_auth_rate: breakAuthRate,
      task_completion_score: taskCompletionScore,
      achievement_rate: achievementRate,
      previous_month_diff: previousMonthDiff,
      total_score: null,
    },
    { onConflict: "store_id,year_month" }
  );
  if (error) throw error;

  revalidatePath("/admin/monthly-achievement");
  revalidatePath(`/stores/${storeId}/my-performance`);
}
