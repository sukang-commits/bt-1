import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export type NotificationType =
  | "notice.created"
  | "settlement.submitted"
  | "settlement.revision_requested"
  | "shift_cover.requested"
  | "shift_cover.accepted"
  | "shift_cover.approved"
  | "checklist.needs_supplement"
  | "rank.changed";

interface NotifyInput {
  profileId: string;
  type: NotificationType;
  title: string;
  body?: string;
  linkPath?: string;
}

// 다른 기능(공지/정산/대타/체크리스트/등급)의 서버 액션에서 호출하는 공용 알림 발송 함수.
// notifications 테이블에는 일반 insert 정책이 없으므로 반드시 create_notification()
// SECURITY DEFINER 함수를 통해서만 기록됩니다 (알림 위조 방지).
export async function notifyProfile(supabase: Client, input: NotifyInput) {
  await supabase.rpc("create_notification", {
    p_profile_id: input.profileId,
    p_type: input.type,
    p_title: input.title,
    p_body: input.body ?? null,
    p_link_path: input.linkPath ?? null,
  });
}

export async function notifyProfiles(supabase: Client, profileIds: string[], input: Omit<NotifyInput, "profileId">) {
  await Promise.all(profileIds.map((profileId) => notifyProfile(supabase, { ...input, profileId })));
}

// 정산/휴게/체크리스트 제출을 검토해야 하는 해당 매장 store_manager 목록.
export async function getStoreManagerProfileIds(supabase: Client, storeId: string): Promise<string[]> {
  const { data: members } = await supabase.from("store_members").select("profile_id").eq("store_id", storeId);
  const memberIds = (members ?? []).map((m) => m.profile_id);
  if (memberIds.length === 0) return [];

  const { data: managers } = await supabase
    .from("profiles")
    .select("id")
    .in("id", memberIds)
    .eq("role", "store_manager")
    .eq("active", true);

  return (managers ?? []).map((m) => m.id);
}
