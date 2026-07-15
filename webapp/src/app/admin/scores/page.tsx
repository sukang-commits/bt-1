import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { StoreScoreComparisonChart } from "@/components/qsc/StoreScoreComparisonChart";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { diffFromPrevious, listTotalScoresForAllStores } from "@/lib/qsc/queries";
import { totalScoreGrade } from "@/lib/qsc/scoring";
import { currentYearMonthKst } from "@/lib/date";

export default async function AdminScoresPage({
  searchParams,
}: {
  searchParams: Promise<{ yearMonth?: string }>;
}) {
  const { yearMonth } = await searchParams;
  const targetYearMonth = yearMonth ?? currentYearMonthKst();
  const supabase = await createServerSupabaseClient();
  const rows = await listTotalScoresForAllStores(supabase, targetYearMonth);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">종합점수</h1>

      <form className="flex flex-wrap items-center gap-2">
        <input type="month" name="yearMonth" defaultValue={targetYearMonth} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <Button type="submit" variant="outline">
          조회
        </Button>
      </form>

      <Card>
        <StoreScoreComparisonChart rows={rows} />
      </Card>

      <Card>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <th className="py-2 pr-3 font-medium">순위</th>
              <th className="py-2 pr-3 font-medium">매장명</th>
              <th className="py-2 pr-3 font-medium">QSC</th>
              <th className="py-2 pr-3 font-medium">월 달성률</th>
              <th className="py-2 pr-3 font-medium">총합점수</th>
              <th className="py-2 pr-3 font-medium">전월 대비</th>
              <th className="py-2 pr-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const diff = diffFromPrevious(row.totalScore, row.previousTotalScore);
              return (
                <tr key={row.storeId} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 text-ink">{index + 1}</td>
                  <td className="py-2 pr-3 font-medium text-ink">{row.storeName}</td>
                  <td className="py-2 pr-3 text-ink">{row.qscTotal ?? "-"}</td>
                  <td className="py-2 pr-3 text-ink">{row.monthlyAchievementRate ?? "-"}</td>
                  <td className="py-2 pr-3 font-semibold text-ink">{row.totalScore ?? "-"}</td>
                  <td className="py-2 pr-3">
                    {diff === null ? (
                      "-"
                    ) : (
                      <span className={diff >= 0 ? "text-success" : "text-danger"}>
                        {diff >= 0 ? "+" : ""}
                        {diff}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3">
                    {row.totalScore !== null ? <StatusBadge label={totalScoreGrade(row.totalScore)} /> : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
