import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrandTypeEnum, ChecklistSubmissionStatusEnum, Database } from "@/types/database";
import { getAttachmentSignedUrl } from "@/lib/storage/upload";

type Client = SupabaseClient<Database>;

export async function listChecklistsForStore(supabase: Client, storeId: string, brandType: BrandTypeEnum) {
  const { data } = await supabase
    .from("checklists")
    .select("*")
    .is("deleted_at", null)
    .eq("active", true)
    .or(`store_id.eq.${storeId},store_id.is.null`)
    .eq("brand_type", brandType)
    .order("type");
  return data ?? [];
}

// 매장 관리자가 "매장 업무 관리" 화면에서 보는 목록. 매장 전용 템플릿(수정 가능)과
// 브랜드 공통 템플릿(참고용, 상위 관리자만 수정 가능)을 함께 보여주되 비활성 템플릿도 포함합니다.
export async function listChecklistsForStoreManagement(supabase: Client, storeId: string, brandType: BrandTypeEnum) {
  const { data } = await supabase
    .from("checklists")
    .select("*")
    .is("deleted_at", null)
    .or(`store_id.eq.${storeId},store_id.is.null`)
    .eq("brand_type", brandType)
    .order("type");
  return data ?? [];
}

export async function listChecklistTemplatesForAdmin(supabase: Client) {
  const { data } = await supabase
    .from("checklists")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getChecklistWithItems(supabase: Client, checklistId: string) {
  const [{ data: checklist }, { data: items }] = await Promise.all([
    supabase.from("checklists").select("*").eq("id", checklistId).maybeSingle(),
    supabase
      .from("checklist_items")
      .select("*")
      .eq("checklist_id", checklistId)
      .is("deleted_at", null)
      .eq("active", true)
      .order("sort_order"),
  ]);
  return { checklist, items: items ?? [] };
}

export async function getSubmissionForToday(
  supabase: Client,
  checklistId: string,
  profileId: string,
  workDate: string
) {
  const { data: submission } = await supabase
    .from("checklist_submissions")
    .select("*")
    .eq("checklist_id", checklistId)
    .eq("profile_id", profileId)
    .eq("work_date", workDate)
    .maybeSingle();

  if (!submission) return { submission: null, itemSubmissions: [] };

  const { data: itemSubmissions } = await supabase
    .from("checklist_item_submissions")
    .select("*")
    .eq("submission_id", submission.id);

  return { submission, itemSubmissions: itemSubmissions ?? [] };
}

export async function getSubmissionById(supabase: Client, submissionId: string) {
  const { data: submission } = await supabase
    .from("checklist_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (!submission) return { submission: null, itemSubmissions: [] };

  const { data: itemSubmissions } = await supabase
    .from("checklist_item_submissions")
    .select("*")
    .eq("submission_id", submission.id);

  return { submission, itemSubmissions: itemSubmissions ?? [] };
}

// 체크리스트 검토 화면에서 항목별 첨부 사진을 보여주기 위해 attachment id → 서명된 URL로 변환합니다.
// attachments 버킷은 비공개이므로 storage_path를 알아도 서명된 URL 없이는 접근할 수 없습니다.
export async function getAttachmentSignedUrls(supabase: Client, attachmentIds: string[]) {
  const ids = [...new Set(attachmentIds.filter((id): id is string => Boolean(id)))];
  if (ids.length === 0) return {} as Record<string, string>;

  const { data: attachments } = await supabase.from("attachments").select("id, storage_path").in("id", ids);
  const entries = await Promise.all(
    (attachments ?? []).map(async (a) => {
      try {
        return [a.id, await getAttachmentSignedUrl(supabase, a.storage_path)] as const;
      } catch {
        return [a.id, null] as const;
      }
    })
  );

  return Object.fromEntries(entries.filter((e): e is [string, string] => Boolean(e[1])));
}

export interface AdminSubmissionFilters {
  storeId?: string;
  status?: ChecklistSubmissionStatusEnum;
}

export async function listSubmissionsForAdmin(supabase: Client, filters: AdminSubmissionFilters) {
  let query = supabase
    .from("checklist_submissions")
    .select("*")
    .order("submitted_at", { ascending: false })
    .limit(100);

  if (filters.storeId) query = query.eq("store_id", filters.storeId);
  if (filters.status) query = query.eq("status", filters.status);

  const { data } = await query;
  return data ?? [];
}
