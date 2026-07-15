import type { SupabaseClient } from "@supabase/supabase-js";
import type { BrandTypeEnum, ChecklistSubmissionStatusEnum, Database } from "@/types/database";

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
