import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WeeklyPerformanceChart } from "@/components/performance/WeeklyPerformanceChart";
import { RecomputeButton } from "@/components/performance/RecomputeButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWeeklyPerformance } from "@/lib/performance/queries";
import { recomputeWeeklyPerformance } from "@/lib/performance/actions";
import { summarizeWeeklyPerformance } from "@/lib/performance/weekly";
import { mondayOfWeek, todayKst } from "@/lib/date";

export default async function AdminWeeklyPerformancePage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; weekStart?: string }>;
}) {
  const { storeId, weekStart } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("id, name").order("code");
  const targetStoreId = storeId ?? stores?.[0]?.id;
  const weekStartDate = weekStart ?? mondayOfWeek(todayKst());

  const rows = targetStoreId ? await listWeeklyPerformance(supabase, targetStoreId, weekStartDate) : [];
  const summary = summarizeWeeklyPerformance(
    rows.map((r) => ({
      dayOfWeek: r.day_of_week ?? 0,
      requiredTasksTotal: r.required_tasks_total,
      requiredTasksCompleted: r.required_tasks_completed,
    }))
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">주간수행도</h1>

      <form className="flex flex-wrap items-center gap-2">
        <select name="storeId" defaultValue={targetStoreId ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="date" name="weekStart" defaultValue={weekStartDate} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <Button type="submit" variant="outline">
          조회
        </Button>
      </form>

      {targetStoreId && (
        <RecomputeButton action={recomputeWeeklyPerformance.bind(null, targetStoreId, weekStartDate)} />
      )}

      <Card>
        <WeeklyPerformanceChart data={summary} />
      </Card>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-3 font-medium">요일</th>
              <th className="py-2 pr-3 font-medium">완료/전체 필수 업무</th>
              <th className="py-2 pr-3 font-medium">수행도</th>
            </tr>
          </thead>
          <tbody>
            {summary.map((s) => {
              const row = rows.find((r) => r.day_of_week === s.dayOfWeek);
              return (
                <tr key={s.dayOfWeek} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 text-ink">{s.dayLabel}요일</td>
                  <td className="py-2 pr-3 text-ink">
                    {row ? `${row.required_tasks_completed}/${row.required_tasks_total}` : "-"}
                  </td>
                  <td className="py-2 pr-3 font-semibold text-ink">{s.rate}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
