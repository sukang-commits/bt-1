import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNoticeAckStats } from "@/lib/notices/queries";
import { todayKst } from "@/lib/date";
import { storeHealthStatus } from "@/lib/performance/thresholds";

export default async function AdminOverviewPage() {
  const supabase = await createServerSupabaseClient();
  const today = todayKst();

  const [
    { data: stores },
    { data: todaysNotices },
    { data: todaysSettlements },
    { count: needsReviewBreaks },
    { count: activeBreaks },
    { count: pendingShiftCovers },
    { data: todaysSubmissions },
  ] = await Promise.all([
    supabase.from("stores").select("id, code, name").order("code"),
    supabase.from("notices").select("*").is("deleted_at", null).gte("publish_at", `${today}T00:00:00`),
    supabase.from("settlements").select("store_id, status, variance").eq("work_date", today),
    supabase.from("breaks").select("id", { count: "exact", head: true }).eq("status", "needs_review"),
    supabase.from("breaks").select("id", { count: "exact", head: true }).is("ended_at", null),
    supabase
      .from("shift_cover_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_admin_approval"),
    supabase.from("checklist_submissions").select("store_id, status, progress_rate").eq("work_date", today),
  ]);

  const ackStatsList = await Promise.all(
    (todaysNotices ?? []).map((n) => getNoticeAckStats(supabase, n))
  );
  const unreadNoticeCount = ackStatsList.reduce((sum, s) => sum + (s.targetCount - s.ackCount), 0);

  const draftSettlements = (todaysSettlements ?? []).filter((s) => s.status === "draft").length;
  const varianceSettlements = (todaysSettlements ?? []).filter((s) => s.variance !== 0).length;
  const needsSupplementChecklists = (todaysSubmissions ?? []).filter((s) => s.status === "needs_supplement").length;

  const SUMMARY_CARDS = [
    { label: "전체 매장 수", value: `${(stores ?? []).length}개` },
    { label: "오늘 미확인 공지 수", value: `${unreadNoticeCount}건` },
    { label: "정산 미제출(작성중) 건수", value: `${draftSettlements}건` },
    { label: "정산 차액 발생 건수", value: `${varianceSettlements}건` },
    { label: "휴게 미인증(확인필요) 건수", value: `${needsReviewBreaks ?? 0}건` },
    { label: "현재 휴게 중 인원", value: `${activeBreaks ?? 0}명` },
    { label: "대타 승인 대기 건수", value: `${pendingShiftCovers ?? 0}건` },
    { label: "체크리스트 보완 요청 건수", value: `${needsSupplementChecklists}건` },
  ];

  const storeRows = (stores ?? []).map((store) => {
    const submissions = (todaysSubmissions ?? []).filter((s) => s.store_id === store.id);
    const todayRate =
      submissions.length === 0
        ? null
        : Math.round(submissions.reduce((sum, s) => sum + s.progress_rate, 0) / submissions.length);

    return {
      ...store,
      todayRate,
      status: todayRate === null ? null : storeHealthStatus(todayRate),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-ink">통합현황</h1>
          <p className="text-sm text-muted">
            오늘({today}) 기준 16개 매장 현황입니다. 주간 수행도·월 달성률은 각 메뉴에서 확인하세요.
          </p>
        </div>
        <Link href="/admin/audit-logs" className="whitespace-nowrap text-sm font-medium text-brand-dark">
          기록 보기
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_CARDS.map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-ink">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">16개 매장 통합 현황</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">매장명</th>
                <th className="py-2 pr-3 font-medium">오늘 수행도</th>
                <th className="py-2 pr-3 font-medium">주간 수행도</th>
                <th className="py-2 pr-3 font-medium">월 달성률</th>
                <th className="py-2 pr-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {storeRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-ink">
                    <Link href={`/stores/${row.id}`} className="hover:underline">
                      {row.name}
                    </Link>
                  </td>
                  <td className="py-2 pr-3 text-ink">{row.todayRate === null ? "-" : `${row.todayRate}%`}</td>
                  <td className="py-2 pr-3 text-muted">-</td>
                  <td className="py-2 pr-3 text-muted">-</td>
                  <td className="py-2 pr-3">
                    {row.status ? <StatusBadge label={row.status} /> : <span className="text-muted">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
