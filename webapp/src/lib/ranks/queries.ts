import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { currentYearMonthKst } from "@/lib/date";

type Client = SupabaseClient<Database>;

export async function listWorkersForAdmin(supabase: Client, storeId?: string) {
  let profileQuery = supabase
    .from("profiles")
    .select("id, name, role, brand_type, active")
    .in("role", ["worker", "store_manager"])
    .eq("active", true);

  if (storeId) {
    const { data: members } = await supabase.from("store_members").select("profile_id").eq("store_id", storeId);
    const ids = (members ?? []).map((m) => m.profile_id);
    if (ids.length === 0) return [];
    profileQuery = profileQuery.in("id", ids);
  }

  const { data: profiles } = await profileQuery.order("name");
  if (!profiles) return [];

  const { data: ranks } = await supabase
    .from("employee_ranks")
    .select("profile_id, grade")
    .in("profile_id", profiles.map((p) => p.id));
  const gradeByProfile = new Map((ranks ?? []).map((r) => [r.profile_id, r.grade]));

  return profiles.map((p) => ({ ...p, grade: gradeByProfile.get(p.id) ?? null }));
}

export async function getWorkerRankProfile(supabase: Client, profileId: string) {
  const [{ data: profile }, { data: rank }, { data: history }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase.from("employee_ranks").select("*").eq("profile_id", profileId).maybeSingle(),
    supabase
      .from("rank_histories")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: false }),
  ]);

  return { profile, rank, history: history ?? [] };
}

export interface PromotionRecommendationInputs {
  monthlyAchievementRate: number | null;
  settlementVarianceCount: number;
  unreadNoticeCount: number;
  checklistSupplementCount: number;
}

// 승급 참고 지표: 최근 월 달성률, 정산 오류(차액) 건수, 공지 미확인 건수, 체크리스트 보완 요청 건수.
// 지각/결근, 관리자 평가는 이 스키마에 없는 항목이라 참고표에서 제외합니다.
export async function getPromotionRecommendationInputs(
  supabase: Client,
  profileId: string,
  storeId: string | null
): Promise<PromotionRecommendationInputs> {
  const yearMonth = currentYearMonthKst();
  const monthStart = `${yearMonth}-01`;

  const [{ data: achievement }, { data: settlements }, { data: submissions }] = await Promise.all([
    storeId
      ? supabase
          .from("monthly_achievements")
          .select("achievement_rate")
          .eq("store_id", storeId)
          .eq("year_month", monthStart)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("settlements").select("variance").eq("profile_id", profileId).gte("work_date", monthStart),
    supabase
      .from("checklist_submissions")
      .select("status")
      .eq("profile_id", profileId)
      .gte("work_date", monthStart),
  ]);

  const { data: notices } = storeId
    ? await supabase
        .from("notices")
        .select("id")
        .is("deleted_at", null)
        .or(`store_id.eq.${storeId},scope.eq.all_stores`)
        .gte("publish_at", `${monthStart}T00:00:00`)
    : { data: [] };

  let unreadNoticeCount = 0;
  const noticeIds = (notices ?? []).map((n) => n.id);
  if (noticeIds.length > 0) {
    const { data: reads } = await supabase
      .from("notice_reads")
      .select("notice_id")
      .eq("profile_id", profileId)
      .in("notice_id", noticeIds);
    const readIds = new Set((reads ?? []).map((r) => r.notice_id));
    unreadNoticeCount = noticeIds.filter((id) => !readIds.has(id)).length;
  }

  return {
    monthlyAchievementRate: achievement?.achievement_rate ?? null,
    settlementVarianceCount: (settlements ?? []).filter((s) => s.variance !== 0).length,
    unreadNoticeCount,
    checklistSupplementCount: (submissions ?? []).filter((s) => s.status === "needs_supplement").length,
  };
}
