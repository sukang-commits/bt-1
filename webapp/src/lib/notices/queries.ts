import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, NoticeRow } from "@/types/database";
import type { NoticeAckStats, NoticeWithReadState } from "@/lib/notices/types";

type Client = SupabaseClient<Database>;

// 매장 화면(근무자)에서 볼 공지 목록: 이 매장 대상(scope=store) + 전체 공지(all_stores) +
// 이 매장이 포함된 복수 매장 공지(multi_store). RLS가 최종적으로 매장 소속 여부를 강제합니다.
export async function listNoticesForStore(
  supabase: Client,
  storeId: string,
  viewerProfileId: string | null
): Promise<NoticeWithReadState[]> {
  const { data: multiStoreLinks } = await supabase
    .from("notice_stores")
    .select("notice_id")
    .eq("store_id", storeId);
  const multiStoreNoticeIds = (multiStoreLinks ?? []).map((l) => l.notice_id);

  const filters = [`store_id.eq.${storeId}`, `scope.eq.all_stores`];
  if (multiStoreNoticeIds.length > 0) {
    filters.push(`id.in.(${multiStoreNoticeIds.join(",")})`);
  }

  const { data: notices } = await supabase
    .from("notices")
    .select("*")
    .is("deleted_at", null)
    .or(filters.join(","))
    .order("is_important", { ascending: false })
    .order("publish_at", { ascending: false });

  return attachReadState(supabase, notices ?? [], viewerProfileId);
}

export async function listNoticesForAdmin(
  supabase: Client,
  viewerProfileId: string | null,
  filterStoreId?: string
): Promise<NoticeWithReadState[]> {
  let query = supabase
    .from("notices")
    .select("*")
    .is("deleted_at", null)
    .order("is_important", { ascending: false })
    .order("publish_at", { ascending: false });

  if (filterStoreId) {
    query = query.eq("store_id", filterStoreId);
  }

  const { data: notices } = await query;
  return attachReadState(supabase, notices ?? [], viewerProfileId);
}

async function attachReadState(
  supabase: Client,
  notices: NoticeRow[],
  viewerProfileId: string | null
): Promise<NoticeWithReadState[]> {
  const noticeIds = notices.map((n) => n.id);
  let readIds = new Set<string>();

  if (viewerProfileId && noticeIds.length > 0) {
    const { data: reads } = await supabase
      .from("notice_reads")
      .select("notice_id")
      .eq("profile_id", viewerProfileId)
      .in("notice_id", noticeIds);
    readIds = new Set((reads ?? []).map((r) => r.notice_id));
  }

  const now = Date.now();

  return notices.map((notice) => ({
    ...notice,
    isRead: readIds.has(notice.id),
    isOverdue: Boolean(notice.ack_due_at) && new Date(notice.ack_due_at as string).getTime() < now,
  }));
}

export async function getNoticeDetail(supabase: Client, noticeId: string) {
  const { data } = await supabase.from("notices").select("*").eq("id", noticeId).maybeSingle();
  return data;
}

// 공지 범위(store/multi_store/all_stores)를 실제 대상 근무자 profile id 목록으로 변환합니다.
// getNoticeAckStats(확인 현황 집계)와 notice 생성 시 알림 발송에서 함께 재사용합니다.
export async function getNoticeTargetProfileIds(
  supabase: Client,
  notice: { id: string; scope: string; store_id: string | null }
): Promise<string[]> {
  let targetStoreIds: string[] = [];

  if (notice.scope === "all_stores") {
    const { data: allStores } = await supabase.from("stores").select("id");
    targetStoreIds = (allStores ?? []).map((s) => s.id);
  } else if (notice.scope === "store" && notice.store_id) {
    targetStoreIds = [notice.store_id];
  } else if (notice.scope === "multi_store") {
    const { data: links } = await supabase
      .from("notice_stores")
      .select("store_id")
      .eq("notice_id", notice.id);
    targetStoreIds = (links ?? []).map((l) => l.store_id);
  }

  if (targetStoreIds.length === 0) return [];

  const { data: members } = await supabase
    .from("store_members")
    .select("profile_id")
    .in("store_id", targetStoreIds);

  const targetProfileIds = Array.from(new Set((members ?? []).map((m) => m.profile_id)));
  if (targetProfileIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .in("id", targetProfileIds)
    .in("role", ["worker", "store_manager"])
    .eq("active", true);

  return (profiles ?? []).map((p) => p.id);
}

export async function getNoticeAckStats(
  supabase: Client,
  notice: { id: string; scope: string; store_id: string | null }
): Promise<NoticeAckStats> {
  const targetProfileIds = await getNoticeTargetProfileIds(supabase, notice);
  if (targetProfileIds.length === 0) {
    return { targetCount: 0, ackCount: 0, rate: 0, readers: [], nonReaders: [] };
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, role, active")
    .in("id", targetProfileIds)
    .in("role", ["worker", "store_manager"])
    .eq("active", true);

  const targets = profiles ?? [];

  const { data: reads } = await supabase
    .from("notice_reads")
    .select("profile_id, read_at")
    .eq("notice_id", notice.id)
    .in("profile_id", targets.map((t) => t.id));

  const readMap = new Map((reads ?? []).map((r) => [r.profile_id, r.read_at]));

  const readers = targets
    .filter((t) => readMap.has(t.id))
    .map((t) => ({ profileId: t.id, name: t.name, readAt: readMap.get(t.id) as string }));
  const nonReaders = targets
    .filter((t) => !readMap.has(t.id))
    .map((t) => ({ profileId: t.id, name: t.name }));

  const targetCount = targets.length;
  const ackCount = readers.length;

  return {
    targetCount,
    ackCount,
    rate: targetCount === 0 ? 0 : Math.round((ackCount / targetCount) * 1000) / 10,
    readers,
    nonReaders,
  };
}
