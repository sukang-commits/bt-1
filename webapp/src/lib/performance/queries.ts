import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

// 특정 매장·특정 날짜에 제출된 체크리스트들의 "필수 업무" 완료/전체 개수를 집계합니다.
export async function getRequiredTaskCounts(supabase: Client, storeId: string, workDate: string) {
  const { data: submissions } = await supabase
    .from("checklist_submissions")
    .select("id")
    .eq("store_id", storeId)
    .eq("work_date", workDate);

  const submissionIds = (submissions ?? []).map((s) => s.id);
  if (submissionIds.length === 0) return { total: 0, completed: 0 };

  const { data: itemSubmissions } = await supabase
    .from("checklist_item_submissions")
    .select("is_checked, checklist_item_id")
    .in("submission_id", submissionIds);

  if (!itemSubmissions || itemSubmissions.length === 0) return { total: 0, completed: 0 };

  const itemIds = Array.from(new Set(itemSubmissions.map((s) => s.checklist_item_id)));
  const { data: items } = await supabase
    .from("checklist_items")
    .select("id, is_required")
    .in("id", itemIds);

  const requiredItemIds = new Set((items ?? []).filter((i) => i.is_required).map((i) => i.id));

  const requiredSubmissions = itemSubmissions.filter((s) => requiredItemIds.has(s.checklist_item_id));
  return {
    total: requiredSubmissions.length,
    completed: requiredSubmissions.filter((s) => s.is_checked).length,
  };
}

export async function listWeeklyPerformance(supabase: Client, storeId: string, weekStartDate: string) {
  const { data } = await supabase
    .from("weekly_performance")
    .select("*")
    .eq("store_id", storeId)
    .eq("week_start_date", weekStartDate)
    .is("profile_id", null)
    .order("day_of_week");
  return data ?? [];
}

export async function getMonthlyAchievement(supabase: Client, storeId: string, yearMonth: string) {
  const { data } = await supabase
    .from("monthly_achievements")
    .select("*")
    .eq("store_id", storeId)
    .eq("year_month", `${yearMonth}-01`)
    .maybeSingle();
  return data;
}
