import Link from "next/link";
import { Coffee, Megaphone, Receipt, Repeat2, ClipboardCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { todayKst } from "@/lib/date";

const QUICK_ACTIONS = [
  { label: "공지 확인", icon: Megaphone, hrefSuffix: "/notices" },
  { label: "업무 체크", icon: ClipboardCheck, hrefSuffix: "/checklist" },
  { label: "정산 인증", icon: Receipt, hrefSuffix: "/settlements" },
  { label: "휴게 시작", icon: Coffee, hrefSuffix: "/breaks" },
  { label: "대타 요청", icon: Repeat2, hrefSuffix: "/shift-cover" },
];

const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  draft: "작성중",
  submitted: "제출완료",
  confirmed: "관리자확인",
  revision_requested: "수정요청",
  completed: "처리완료",
};

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabaseClient();
  const user = await getSessionUser();
  const today = todayKst();

  // 소속 여부는 layout.tsx에서 이미 검증했으므로 여기서는 표시/조회용으로만 사용합니다.
  const [{ data: store }, { data: notices }, { data: submission }, { data: settlement }, { data: todaysBreaks }, { count: openShiftCoverCount }] =
    await Promise.all([
      supabase.from("stores").select("name").eq("id", storeId).maybeSingle(),
      supabase
        .from("notices")
        .select("id")
        .eq("store_id", storeId)
        .is("deleted_at", null),
      user
        ? supabase
            .from("checklist_submissions")
            .select("progress_rate")
            .eq("store_id", storeId)
            .eq("profile_id", user.id)
            .eq("work_date", today)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("settlements")
            .select("status")
            .eq("store_id", storeId)
            .eq("profile_id", user.id)
            .eq("work_date", today)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("breaks")
            .select("ended_at")
            .eq("store_id", storeId)
            .eq("profile_id", user.id)
            .eq("work_date", today)
        : Promise.resolve({ data: null }),
      supabase
        .from("shift_cover_requests")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId)
        .eq("status", "recruiting"),
    ]);

  let unreadNoticeCount = 0;
  const noticeIds = (notices ?? []).map((n) => n.id);
  if (user && noticeIds.length > 0) {
    const { data: reads } = await supabase
      .from("notice_reads")
      .select("notice_id")
      .eq("profile_id", user.id)
      .in("notice_id", noticeIds);
    const readIds = new Set((reads ?? []).map((r) => r.notice_id));
    unreadNoticeCount = noticeIds.filter((id) => !readIds.has(id)).length;
  }

  const breakInProgress = (todaysBreaks ?? []).some((b) => b.ended_at === null);
  const breakUsedToday = (todaysBreaks ?? []).length > 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">{store?.name} 홈</h1>
        <p className="text-sm text-muted">오늘도 안전하고 즐거운 근무 되세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, hrefSuffix }) => (
          <Link
            key={label}
            href={`/stores/${storeId}${hrefSuffix}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center shadow-sm hover:bg-subtle"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20 text-brand-dark">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 공지</CardTitle>
          <StatusBadge label={unreadNoticeCount > 0 ? "미확인" : "확인완료"} />
        </CardHeader>
        <CardDescription>
          {noticeIds.length === 0
            ? "등록된 공지가 없습니다."
            : `전체 ${noticeIds.length}건 중 미확인 ${unreadNoticeCount}건이 있습니다.`}
        </CardDescription>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>오늘의 체크리스트</CardTitle>
            <span className="text-sm font-semibold text-brand-dark">
              {submission ? `${submission.progress_rate}%` : "-"}
            </span>
          </CardHeader>
          {submission ? (
            <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-brand-dark"
                style={{ width: `${submission.progress_rate}%` }}
              />
            </div>
          ) : (
            <CardDescription>오늘 제출한 체크리스트가 없습니다.</CardDescription>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>정산 제출 상태</CardTitle>
            <StatusBadge
              label={settlement ? SETTLEMENT_STATUS_LABEL[settlement.status] : "미제출"}
            />
          </CardHeader>
          <CardDescription>
            {settlement ? "오늘 근무 정산이 등록되어 있습니다." : "오늘 등록된 정산 내역이 없습니다."}
          </CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>휴게 사용 상태</CardTitle>
            <StatusBadge label={breakInProgress ? "휴게중" : breakUsedToday ? "휴게완료" : "미사용"} />
          </CardHeader>
          <CardDescription>
            {breakInProgress
              ? "현재 휴게 중입니다."
              : breakUsedToday
                ? "오늘 휴게를 사용했습니다."
                : "아직 휴게를 사용하지 않았습니다."}
          </CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>모집 중인 대타 요청</CardTitle>
            <span className="text-sm font-semibold text-ink">{openShiftCoverCount ?? 0}건</span>
          </CardHeader>
          <CardDescription>
            {(openShiftCoverCount ?? 0) > 0
              ? "대타 게시판에서 확인해 주세요."
              : "현재 모집 중인 대타 요청이 없습니다."}
          </CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이번 주 수행도</CardTitle>
          </CardHeader>
          <CardDescription>11단계에서 실제 수행도 계산이 연결됩니다.</CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이번 달 달성률</CardTitle>
          </CardHeader>
          <CardDescription>11단계에서 실제 달성률 계산이 연결됩니다.</CardDescription>
        </Card>
      </div>
    </div>
  );
}
