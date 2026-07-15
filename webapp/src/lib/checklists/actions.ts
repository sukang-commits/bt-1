"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { todayKst } from "@/lib/date";
import { checklistItemPhotoRequirement, isPhotoRequiredNow } from "@/lib/grades/policy";
import { notifyProfile } from "@/lib/notifications/notify";
import type { BrandTypeEnum, ChecklistTypeEnum, EmployeeGradeEnum, WorkShiftEnum } from "@/types/database";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || !["senior_manager", "deputy_manager", "administrator"].includes(user.role)) {
    throw new Error("체크리스트 관리는 관리자만 할 수 있습니다.");
  }
  return user;
}

export interface ChecklistTemplateInput {
  storeId: string | null;
  brandType: BrandTypeEnum;
  type: ChecklistTypeEnum;
  name: string;
}

export async function createChecklistTemplate(input: ChecklistTemplateInput) {
  await assertAdmin();
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("checklists")
    .insert({
      store_id: input.storeId,
      brand_type: input.brandType,
      type: input.type,
      name: input.name,
    })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath("/admin/checklists");
  return data.id;
}

export async function updateChecklistTemplate(id: string, input: { name: string; active: boolean }) {
  const user = await assertAdmin();
  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("checklists").select("*").eq("id", id).maybeSingle();
  const { error } = await supabase.from("checklists").update(input).eq("id", id);
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "checklist.update",
    p_target_table: "checklists",
    p_target_id: id,
    p_before_data: before,
    p_after_data: input,
  });

  revalidatePath(`/admin/checklists/${id}`);
}

export interface ChecklistItemInput {
  label: string;
  description: string | null;
  isRequired: boolean;
  requiresPhoto: boolean;
  isCore: boolean;
  workShift: WorkShiftEnum | null;
  sortOrder: number;
}

export async function addChecklistItem(checklistId: string, input: ChecklistItemInput) {
  await assertAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("checklist_items").insert({
    checklist_id: checklistId,
    label: input.label,
    description: input.description,
    is_required: input.isRequired,
    requires_photo: input.requiresPhoto,
    is_core: input.isCore,
    work_shift: input.workShift,
    sort_order: input.sortOrder,
  });
  if (error) throw error;
  revalidatePath(`/admin/checklists/${checklistId}`);
}

export async function deleteChecklistItem(itemId: string, checklistId: string) {
  await assertAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw error;
  revalidatePath(`/admin/checklists/${checklistId}`);
}

export interface ChecklistItemState {
  itemId: string;
  isCore: boolean;
  isRequired: boolean;
  checked: boolean;
  photoAttachmentId: string | null;
  note: string | null;
}

export async function submitChecklist(
  checklistId: string,
  storeId: string,
  grade: EmployeeGradeEnum,
  items: ChecklistItemState[]
) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // 등급 정책에 따라 필요한 사진이 모두 등록됐는지 서버에서 재검증합니다 (클라이언트 검증 우회 방지).
  const missingRequired = items.filter((i) => i.isRequired && !i.checked);
  if (missingRequired.length > 0) {
    throw new Error("완료되지 않은 필수 업무가 있습니다.");
  }

  const missingPhoto = items.filter((i) => {
    const requirement = checklistItemPhotoRequirement(grade, i.isCore);
    const needed = isPhotoRequiredNow(requirement, Boolean(i.note && i.note.trim().length > 0));
    return needed && !i.photoAttachmentId;
  });
  if (missingPhoto.length > 0) {
    throw new Error("등급 정책상 사진 인증이 필요한 항목이 있습니다.");
  }

  const supabase = await createServerSupabaseClient();
  const workDate = todayKst();
  const progressRate = items.length === 0 ? 0 : Math.round((items.filter((i) => i.checked).length / items.length) * 1000) / 10;

  // checklist_submissions_unique_per_day 제약(checklist_id, profile_id, work_date) 덕분에
  // upsert가 원자적으로 처리되어, 이중 클릭/동시 요청으로 인한 중복 제출 행이 생기지 않습니다.
  const { data: submission, error: submissionError } = await supabase
    .from("checklist_submissions")
    .upsert(
      {
        checklist_id: checklistId,
        store_id: storeId,
        profile_id: user.id,
        work_date: workDate,
        status: "submitted",
        progress_rate: progressRate,
        reviewed_by: null,
        reviewed_at: null,
        review_note: null,
        submitted_at: new Date().toISOString(),
      },
      { onConflict: "checklist_id,profile_id,work_date" }
    )
    .select("id")
    .single();
  if (submissionError) throw submissionError;
  const submissionId = submission.id;

  await supabase.from("checklist_item_submissions").delete().eq("submission_id", submissionId);

  const { error: itemsError } = await supabase.from("checklist_item_submissions").insert(
    items.map((i) => ({
      submission_id: submissionId,
      checklist_item_id: i.itemId,
      is_checked: i.checked,
      photo_attachment_id: i.photoAttachmentId,
      note: i.note,
    }))
  );
  if (itemsError) throw itemsError;

  revalidatePath(`/stores/${storeId}/checklist`);
  revalidatePath(`/stores/${storeId}`);
  return submissionId;
}

export async function reviewChecklistSubmission(
  submissionId: string,
  storeId: string,
  action: "confirm" | "needs_supplement",
  note: string | null
) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const isAdmin = ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  const isStoreManager = user.role === "store_manager" && user.storeId === storeId;
  if (!isAdmin && !isStoreManager) throw new Error("체크리스트를 검토할 권한이 없습니다.");

  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase
    .from("checklist_submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  const { error } = await supabase
    .from("checklist_submissions")
    .update({
      status: action === "confirm" ? "confirmed" : "needs_supplement",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: note,
    })
    .eq("id", submissionId);
  if (error) throw error;

  if (action === "needs_supplement" && before) {
    await notifyProfile(supabase, {
      profileId: before.profile_id,
      type: "checklist.needs_supplement",
      title: "체크리스트 보완 요청",
      body: note ?? undefined,
      linkPath: `/stores/${storeId}/checklist/${before.checklist_id}`,
    });
  }

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: `checklist_submission.${action}`,
    p_target_table: "checklist_submissions",
    p_target_id: submissionId,
    p_before_data: before,
    p_after_data: { status: action === "confirm" ? "confirmed" : "needs_supplement" },
  });

  revalidatePath(`/stores/${storeId}/checklist`);
  revalidatePath("/admin/checklists/submissions");
}
