import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, ShiftCoverStatusEnum } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function listShiftCoverRequestsForStore(supabase: Client, storeId: string) {
  const { data } = await supabase
    .from("shift_cover_requests")
    .select("*")
    .eq("store_id", storeId)
    .order("is_urgent", { ascending: false })
    .order("work_date", { ascending: true });
  return data ?? [];
}

export async function listShiftCoverRequestsForAdmin(supabase: Client, status?: ShiftCoverStatusEnum) {
  let query = supabase.from("shift_cover_requests").select("*").order("work_date", { ascending: true });
  if (status) query = query.eq("status", status);
  const { data } = await query;
  return data ?? [];
}

export async function getShiftCoverRequestDetail(supabase: Client, id: string) {
  const { data } = await supabase.from("shift_cover_requests").select("*").eq("id", id).maybeSingle();
  return data;
}

export async function listAcceptancesForRequest(supabase: Client, requestId: string) {
  const { data } = await supabase
    .from("shift_cover_acceptances")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

// "같은 시간대 중복 수락" 경고용: 이 근무자가 이미 수락(대기중 또는 승인)해 둔
// 같은 근무일의 다른 대타 건이 있는지 확인합니다.
export async function findOverlappingAcceptance(
  supabase: Client,
  profileId: string,
  workDate: string
) {
  const { data: myAcceptances } = await supabase
    .from("shift_cover_acceptances")
    .select("id, request_id")
    .eq("accepted_by", profileId)
    .in("status", ["pending", "approved"]);

  if (!myAcceptances || myAcceptances.length === 0) return null;

  const requestIds = myAcceptances.map((a) => a.request_id);
  const { data: requests } = await supabase
    .from("shift_cover_requests")
    .select("id, work_date, start_time, end_time")
    .in("id", requestIds)
    .eq("work_date", workDate);

  return requests && requests.length > 0 ? requests[0] : null;
}
