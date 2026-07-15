"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import type { NoticeScopeEnum } from "@/types/database";

export interface NoticeFormInput {
  title: string;
  content: string;
  scope: NoticeScopeEnum;
  storeId: string | null;
  storeIds: string[];
  isImportant: boolean;
  requiresAck: boolean;
  ackDueAt: string | null;
  attachmentIds: string[];
}

async function assertCanManage(scope: NoticeScopeEnum, storeId: string | null) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const isAdmin = ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  if (isAdmin) return user;

  if (user.role === "store_manager" && scope === "store" && storeId === user.storeId) {
    return user;
  }

  throw new Error("공지를 작성/수정할 권한이 없습니다.");
}

export async function createNotice(input: NoticeFormInput) {
  const user = await assertCanManage(input.scope, input.storeId);
  const supabase = await createServerSupabaseClient();

  const { data: notice, error } = await supabase
    .from("notices")
    .insert({
      title: input.title,
      content: input.content,
      scope: input.scope,
      store_id: input.scope === "store" ? input.storeId : null,
      is_important: input.isImportant,
      requires_ack: input.requiresAck,
      ack_due_at: input.ackDueAt,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) throw error;

  if (input.scope === "multi_store" && input.storeIds.length > 0) {
    await supabase
      .from("notice_stores")
      .insert(input.storeIds.map((storeId) => ({ notice_id: notice.id, store_id: storeId })));
  }

  if (input.attachmentIds.length > 0) {
    await supabase
      .from("notice_attachments")
      .insert(input.attachmentIds.map((attachmentId) => ({ notice_id: notice.id, attachment_id: attachmentId })));
  }

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "notice.create",
    p_target_table: "notices",
    p_target_id: notice.id,
    p_before_data: null,
    p_after_data: { title: input.title, scope: input.scope, store_id: input.storeId },
  });

  revalidatePath("/admin/notices");
  if (input.storeId) revalidatePath(`/stores/${input.storeId}/notices`);

  return notice.id;
}

export async function updateNotice(noticeId: string, input: NoticeFormInput) {
  const user = await assertCanManage(input.scope, input.storeId);
  const supabase = await createServerSupabaseClient();

  const { data: before } = await supabase.from("notices").select("*").eq("id", noticeId).maybeSingle();

  const { error } = await supabase
    .from("notices")
    .update({
      title: input.title,
      content: input.content,
      is_important: input.isImportant,
      requires_ack: input.requiresAck,
      ack_due_at: input.ackDueAt,
    })
    .eq("id", noticeId);

  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "notice.update",
    p_target_table: "notices",
    p_target_id: noticeId,
    p_before_data: before,
    p_after_data: { title: input.title, is_important: input.isImportant },
  });

  revalidatePath("/admin/notices");
  if (input.storeId) revalidatePath(`/stores/${input.storeId}/notices`);
}

export async function deleteNotice(noticeId: string, storeId: string | null) {
  const supabase = await createServerSupabaseClient();
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const { error } = await supabase
    .from("notices")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", noticeId);
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "notice.delete",
    p_target_table: "notices",
    p_target_id: noticeId,
  });

  revalidatePath("/admin/notices");
  if (storeId) revalidatePath(`/stores/${storeId}/notices`);
}

export async function markNoticeRead(noticeId: string, storeId: string) {
  const supabase = await createServerSupabaseClient();
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  // unique(notice_id, profile_id)라 중복 확인은 자동으로 막힙니다.
  const { error } = await supabase
    .from("notice_reads")
    .upsert({ notice_id: noticeId, profile_id: user.id }, { onConflict: "notice_id,profile_id", ignoreDuplicates: true });
  if (error) throw error;

  revalidatePath(`/stores/${storeId}/notices/${noticeId}`);
  revalidatePath(`/stores/${storeId}/notices`);
  revalidatePath(`/stores/${storeId}`);
}
