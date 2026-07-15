import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { RecomputeButton } from "@/components/performance/RecomputeButton";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMonthlyAchievement } from "@/lib/performance/queries";
import { recomputeMonthlyAchievement } from "@/lib/performance/actions";
import { currentYearMonthKst } from "@/lib/date";

export default async function AdminMonthlyAchievementPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; yearMonth?: string }>;
}) {
  const { storeId, yearMonth } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("id, name").order("code");
  const targetStoreId = storeId ?? stores?.[0]?.id;
  const targetYearMonth = yearMonth ?? currentYearMonthKst();

  const achievement = targetStoreId
    ? await getMonthlyAchievement(supabase, targetStoreId, targetYearMonth)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">월 달성률</h1>

      <form className="flex flex-wrap items-center gap-2">
        <select name="storeId" defaultValue={targetStoreId ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="month" name="yearMonth" defaultValue={targetYearMonth} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <Button type="submit" variant="outline">
          조회
        </Button>
      </form>

      {targetStoreId && (
        <RecomputeButton action={recomputeMonthlyAchievement.bind(null, targetStoreId, targetYearMonth)} />
      )}

      {achievement ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{targetYearMonth} 종합 달성률</CardTitle>
              <span className="text-2xl font-bold text-brand-dark">{achievement.achievement_rate}%</span>
            </CardHeader>
            {achievement.previous_month_diff !== null && (
              <CardDescription>
                전월 대비{" "}
                <span className={achievement.previous_month_diff >= 0 ? "text-success" : "text-danger"}>
                  {achievement.previous_month_diff >= 0 ? "+" : ""}
                  {achievement.previous_month_diff}%p
                </span>
              </CardDescription>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>세부 항목</CardTitle>
            </CardHeader>
            <ul className="flex flex-col gap-2 text-sm text-ink">
              <li className="flex justify-between">
                <span>주간 업무 수행도 (50%)</span>
                <span>{achievement.weekly_performance_rate}%</span>
              </li>
              <li className="flex justify-between">
                <span>정산 인증 완료율 (20%)</span>
                <span>{achievement.settlement_rate}%</span>
              </li>
              <li className="flex justify-between">
                <span>공지 확인율 (10%)</span>
                <span>{achievement.notice_ack_rate}%</span>
              </li>
              <li className="flex justify-between">
                <span>휴게시간 인증률 (10%)</span>
                <span>{achievement.break_auth_rate}%</span>
              </li>
              <li className="flex justify-between">
                <span>업무 완료 점수 (10%)</span>
                <span>{achievement.task_completion_score}%</span>
              </li>
            </ul>
          </Card>
        </>
      ) : (
        <Card>
          <CardDescription>
            아직 계산된 데이터가 없습니다. 재계산 버튼을 눌러 이번 달 달성률을 계산해 주세요.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
