import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { WeeklyPerformanceChart } from "@/components/performance/WeeklyPerformanceChart";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWeeklyPerformance, getMonthlyAchievement } from "@/lib/performance/queries";
import { summarizeWeeklyPerformance } from "@/lib/performance/weekly";
import { currentYearMonthKst, mondayOfWeek, todayKst } from "@/lib/date";

export default async function MyPerformancePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabaseClient();
  const weekStartDate = mondayOfWeek(todayKst());
  const yearMonth = currentYearMonthKst();

  const [rows, achievement] = await Promise.all([
    listWeeklyPerformance(supabase, storeId, weekStartDate),
    getMonthlyAchievement(supabase, storeId, yearMonth),
  ]);

  const summary = summarizeWeeklyPerformance(
    rows.map((r) => ({
      dayOfWeek: r.day_of_week ?? 0,
      requiredTasksTotal: r.required_tasks_total,
      requiredTasksCompleted: r.required_tasks_completed,
    }))
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">내 수행도</h1>

      <Card>
        <CardHeader>
          <CardTitle>이번 주 수행도</CardTitle>
        </CardHeader>
        <WeeklyPerformanceChart data={summary} />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>이번 달 달성률</CardTitle>
          <span className="text-xl font-bold text-brand-dark">
            {achievement ? `${achievement.achievement_rate}%` : "-"}
          </span>
        </CardHeader>
        <CardDescription>
          {achievement
            ? achievement.previous_month_diff !== null
              ? `전월 대비 ${achievement.previous_month_diff >= 0 ? "+" : ""}${achievement.previous_month_diff}%p`
              : "이번 달 첫 계산입니다."
            : "아직 이번 달 달성률이 계산되지 않았습니다."}
        </CardDescription>
      </Card>
    </div>
  );
}
