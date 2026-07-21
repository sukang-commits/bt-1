"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import type { WorkShiftEnum } from "@/types/database";
import { EDITABLE_STATUSES } from "@/lib/settlements/types";
import { getStoreManagerProfileIds, notifyProfiles, notifyProfile } from "@/lib/notifications/notify";

export interface SettlementFormInput {
  storeId: string;
  workDate: string;
  workShift: WorkShiftEnum;
  posAmount: number;
  cashAmount: number;
  cardConfirmed: boolean;
  note: string | null;
  photoAttachmentId: string | null;
  extraFields: Record<string, unknown>;
  submit: boolean; // false=임시저장(draft), true=제출
}

export async function saveSettlement(existingId: string | null, input: SettlementFormInput) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const variance = input.cashAmount - input.posAmount;
  if (variance !== 0 && (!input.note || input.note.trim().length === 0)) {
    throw new Error("차액이 발생한 경우 특이사항을 입력해야 합니다.");
  }

  const supabase = await createServerSupabaseClient();
  const status = input.submit ? "submitted" : "draft";
  const payload = {
    store_id: input.storeId,
    profile_id: user.id,
    work_date: input.workDate,
    work_shift: input.workShift,
    pos_amount: input.posAmount,
    cash_amount: input.cashAmount,
    card_confirmed: input.cardConfirmed,
    note: input.note,
    photo_attachment_id: input.photoAttachmentId,
    extra_fields: input.extraFields,
    status: status as "draft" | "submitted",
    submitted_at: input.submit ? new Date().toISOString() : null,
    reviewed_by: null,
    reviewed_at: null,
    revision_reason: null,
  };

  if (existingId) {
    const { data: existing } = await supabase
      .from("settlements")
      .select("status")
      .eq("id", existingId)
      .maybeSingle();

    if (!existing || !EDITABLE_STATUSES.includes(existing.status)) {
      throw new Error("이미 제출되어 수정할 수 없는 정산입니다.");
    }

    const { error } = await supabase.from("settlements").update(payload).eq("id", existingId);
    if (error) throw error;

    if (input.submit) {
      const managerIds = await getStoreManagerProfileIds(supabase, input.storeId);
      await notifyProfiles(supabase, managerIds, {
        type: "settlement.submitted",
        title: "정산 제출 완료",
        body: `${input.workDate} 정산이 제출되었습니다.`,
        linkPath: `/stores/${input.storeId}/settlements/${existingId}`,
      });
    }

    revalidatePath(`/stores/${input.storeId}/settlements`);
    return existingId;
  }

  const { data, error } = await supabase.from("settlements").insert(payload).select("id").single();
  if (error) throw error;

  if (input.submit) {
    const managerIds = await getStoreManagerProfileIds(supabase, input.storeId);
    await notifyProfiles(supabase, managerIds, {
      type: "settlement.submitted",
      title: "정산 제출 완료",
      body: `${input.workDate} 정산이 제출되었습니다.`,
      linkPath: `/stores/${input.storeId}/settlements/${data.id}`,
    });
  }

  revalidatePath(`/stores/${input.storeId}/settlements`);
  return data.id;
}

export async function reviewSettlement(
  settlementId: string,
  storeId: string,
  action: "confirm" | "complete" | "request_revision",
  revisionReason?: string
) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const isAdmin = ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  const isStoreManager = user.role === "store_manager" && user.storeId === storeId;
  if (!isAdmin && !isStoreManager) throw new Error("정산을 검토할 권한이 없습니다.");

  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("settlements").select("*").eq("id", settlementId).maybeSingle();

  const statusMap = {
    confirm: "confirmed",
    complete: "completed",
    request_revision: "revision_requested",
  } as const;

  const { error } = await supabase
    .from("settlements")
    .update({
      status: statusMap[action],
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      revision_reason: action === "request_revision" ? (revisionReason ?? null) : before?.revision_reason ?? null,
    })
    .eq("id", settlementId);
  if (error) throw error;

  if (action === "request_revision" && before) {
    await notifyProfile(supabase, {
      profileId: before.profile_id,
      type: "settlement.revision_requested",
      title: "정산 수정 요청",
      body: revisionReason,
      linkPath: `/stores/${storeId}/settlements/${settlementId}`,
    });
  }

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: `settlement.${action}`,
    p_target_table: "settlements",
    p_target_id: settlementId,
    p_before_data: before,
    p_after_data: { status: statusMap[action] },
  });

  revalidatePath(`/stores/${storeId}/settlements`);
  revalidatePath("/admin/settlements");
}
