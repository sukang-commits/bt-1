import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { GradeChangeForm } from "@/components/ranks/GradeChangeForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPromotionRecommendationInputs, getWorkerRankProfile } from "@/lib/ranks/queries";
import { GRADE_LABELS, ROLE_LABELS } from "@/types/domain";
import { formatDateTimeKst } from "@/lib/date";

const CHANGE_TYPE_LABEL = { promotion: "승급", demotion: "강등", honor_grant: "명예 등급 부여" } as const;

export default async function AdminRankDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const supabase = await createServerSupabaseClient();
  const { profile, rank, history } = await getWorkerRankProfile(supabase, profileId);
  if (!profile) notFound();

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("profile_id", profileId)
    .eq("is_primary", true)
    .maybeSingle();

  const recommendation = await getPromotionRecommendationInputs(
    supabase,
    profileId,
    membership?.store_id ?? null
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/admin/ranks" className="text-sm text-muted">
        ← 등급관리로
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{profile.name}</CardTitle>
          <span className="text-lg font-bold text-brand-dark">
            {rank ? GRADE_LABELS[rank.grade] : "등급 없음"}
          </span>
        </CardHeader>
        <CardDescription>{ROLE_LABELS[profile.role]}</CardDescription>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>권장 승급 참고 지표 (이번 달)</CardTitle>
        </CardHeader>
        <ul className="flex flex-col gap-1.5 text-sm text-ink">
          <li className="flex justify-between">
            <span>월 달성률</span>
            <span>{recommendation.monthlyAchievementRate ?? "-"}%</span>
          </li>
          <li className="flex justify-between">
            <span>정산 차액 발생 건수</span>
            <span>{recommendation.settlementVarianceCount}건</span>
          </li>
          <li className="flex justify-between">
            <span>공지 미확인 건수</span>
            <span>{recommendation.unreadNoticeCount}건</span>
          </li>
          <li className="flex justify-between">
            <span>체크리스트 보완 요청 건수</span>
            <span>{recommendation.checklistSupplementCount}건</span>
          </li>
          <li className="text-xs text-muted">
            지각/결근, 관리자 정성 평가는 현재 시스템에서 별도로 기록하지 않아 참고표에서 제외했습니다.
          </li>
        </ul>
        {(rank?.grade === "challenger" || rank?.grade === "royal_bee") && (
          <p className="mt-2 rounded-lg bg-warning-bg p-2 text-xs text-warning">
            챌린저/로열비는 자동 승급 대상이 아니며 관리자 승인으로만 부여됩니다.
          </p>
        )}
      </Card>

      <GradeChangeForm profileId={profileId} brandType={profile.brand_type} currentGrade={rank?.grade ?? null} />

      <Card>
        <CardHeader>
          <CardTitle>등급 변경 이력</CardTitle>
        </CardHeader>
        {history.length === 0 ? (
          <CardDescription>변경 이력이 없습니다.</CardDescription>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium text-ink">
                  {h.previous_grade ? GRADE_LABELS[h.previous_grade] : "없음"} → {GRADE_LABELS[h.new_grade]}{" "}
                  <span className="text-xs text-muted">({CHANGE_TYPE_LABEL[h.change_type]})</span>
                </p>
                <p className="text-xs text-muted">
                  적용일 {h.effective_date} · {formatDateTimeKst(h.created_at)}
                </p>
                {h.reason && <p className="mt-1 text-ink">{h.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
