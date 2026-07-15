"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { notifyProfile, notifyProfiles } from "@/lib/notifications/notify";

export interface ShiftCoverRequestInput {
  storeId: string;
  workDate: string;
  startTime: string;
  endTime: string;
  position: string | null;
  reason: string | null;
  isUrgent: boolean;
}

export async function createShiftCoverRequest(input: ShiftCoverRequestInput) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("shift_cover_requests")
    .insert({
      store_id: input.storeId,
      requested_by: user.id,
      work_date: input.workDate,
      start_time: input.startTime,
      end_time: input.endTime,
      position: input.position,
      reason: input.reason,
      is_urgent: input.isUrgent,
      status: "recruiting",
      cancelled_at: null,
    })
    .select("id")
    .single();

  if (error) throw error;

  const { data: members } = await supabase.from("store_members").select("profile_id").eq("store_id", input.storeId);
  const otherMemberIds = (members ?? []).map((m) => m.profile_id).filter((id) => id !== user.id);
  if (otherMemberIds.length > 0) {
    await notifyProfiles(supabase, otherMemberIds, {
      type: "shift_cover.requested",
      title: "새 대타 요청이 등록되었습니다",
      body: `${input.workDate} ${input.startTime.slice(0, 5)}~${input.endTime.slice(0, 5)}`,
      linkPath: `/stores/${input.storeId}/shift-cover/${data.id}`,
    });
  }

  revalidatePath(`/stores/${input.storeId}/shift-cover`);
  return data.id;
}

export async function acceptShiftCoverRequest(requestId: string, storeId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const isCrossStore = user.storeId !== storeId;

  // guard_shift_cover_acceptance 트리거가 본인 요청 자기 수락 / 마감된 요청 수락을 DB에서 차단합니다.
  const { error } = await supabase.from("shift_cover_acceptances").insert({
    request_id: requestId,
    accepted_by: user.id,
    is_cross_store: isCrossStore,
    status: "pending",
    admin_approved_by: null,
    admin_approved_at: null,
  });

  if (error) {
    if (error.message.includes("본인이 등록한")) throw new Error("본인이 등록한 대타 요청은 수락할 수 없습니다.");
    if (error.message.includes("종료되었거나")) throw new Error("이미 마감된 대타 요청입니다.");
    throw error;
  }

  // 첫 수락이 들어오면 요청 상태를 "수락자확인중"으로 전환합니다.
  await supabase
    .from("shift_cover_requests")
    .update({ status: "pending_acceptance" })
    .eq("id", requestId)
    .eq("status", "recruiting");

  const { data: request } = await supabase
    .from("shift_cover_requests")
    .select("requested_by")
    .eq("id", requestId)
    .maybeSingle();
  if (request) {
    await notifyProfile(supabase, {
      profileId: request.requested_by,
      type: "shift_cover.accepted",
      title: "대타 수락 신청이 들어왔습니다",
      linkPath: `/stores/${storeId}/shift-cover/${requestId}`,
    });
  }

  revalidatePath(`/stores/${storeId}/shift-cover`);
  revalidatePath(`/stores/${storeId}/shift-cover/${requestId}`);
}

// 요청자가 여러 수락 신청 중 한 명을 선택합니다. 같은 매장이면 바로 승인 완료,
// 다른 매장 근무자라면 관리자 승인 대기 상태로 넘어갑니다.
export async function chooseAcceptance(acceptanceId: string, requestId: string, storeId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const { data: request } = await supabase
    .from("shift_cover_requests")
    .select("requested_by")
    .eq("id", requestId)
    .maybeSingle();

  if (!request || request.requested_by !== user.id) {
    throw new Error("요청자만 수락자를 선택할 수 있습니다.");
  }

  const { data: acceptance } = await supabase
    .from("shift_cover_acceptances")
    .select("is_cross_store")
    .eq("id", acceptanceId)
    .maybeSingle();
  if (!acceptance) throw new Error("수락 신청을 찾을 수 없습니다.");

  if (acceptance.is_cross_store) {
    const { error } = await supabase
      .from("shift_cover_requests")
      .update({ status: "pending_admin_approval" })
      .eq("id", requestId);
    if (error) throw error;
  } else {
    // shift_cover_acceptances_one_approved_per_request 부분 unique 인덱스 덕분에, 두 수락 건이
    // 동시에 선택되더라도 하나만 승인 상태로 남고 나머지는 아래에서 에러로 드러납니다.
    const { error: acceptanceError } = await supabase
      .from("shift_cover_acceptances")
      .update({ status: "approved" })
      .eq("id", acceptanceId);
    if (acceptanceError) {
      if (acceptanceError.code === "23505") throw new Error("이미 다른 수락자가 승인되었습니다.");
      throw acceptanceError;
    }

    const { error: requestError } = await supabase
      .from("shift_cover_requests")
      .update({ status: "approved" })
      .eq("id", requestId);
    if (requestError) throw requestError;
  }

  revalidatePath(`/stores/${storeId}/shift-cover/${requestId}`);
}

export async function approveAcceptance(acceptanceId: string, requestId: string, storeId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");
  if (!["senior_manager", "deputy_manager", "administrator"].includes(user.role)) {
    throw new Error("대타 요청의 최종 승인은 관리자만 처리할 수 있습니다.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase
    .from("shift_cover_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  const { data: acceptance } = await supabase
    .from("shift_cover_acceptances")
    .select("accepted_by")
    .eq("id", acceptanceId)
    .maybeSingle();

  const { error: acceptanceError } = await supabase
    .from("shift_cover_acceptances")
    .update({ status: "approved", admin_approved_by: user.id, admin_approved_at: new Date().toISOString() })
    .eq("id", acceptanceId);
  if (acceptanceError) {
    if (acceptanceError.code === "23505") throw new Error("이미 다른 수락자가 승인되었습니다.");
    throw acceptanceError;
  }

  const { error } = await supabase
    .from("shift_cover_requests")
    .update({ status: "approved" })
    .eq("id", requestId);
  if (error) throw error;

  const recipientIds = [before?.requested_by, acceptance?.accepted_by].filter(
    (id): id is string => Boolean(id)
  );
  await Promise.all(
    recipientIds.map((profileId) =>
      notifyProfile(supabase, {
        profileId,
        type: "shift_cover.approved",
        title: "대타 요청이 관리자 승인되었습니다",
        linkPath: `/stores/${storeId}/shift-cover/${requestId}`,
      })
    )
  );

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "shift_cover.approve",
    p_target_table: "shift_cover_requests",
    p_target_id: requestId,
    p_before_data: before,
    p_after_data: { status: "approved" },
  });

  revalidatePath(`/stores/${storeId}/shift-cover/${requestId}`);
  revalidatePath("/admin/shift-cover");
}

export async function cancelShiftCoverRequest(requestId: string, storeId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const { data: request } = await supabase
    .from("shift_cover_requests")
    .select("requested_by, status")
    .eq("id", requestId)
    .maybeSingle();

  if (!request) throw new Error("요청을 찾을 수 없습니다.");
  if (request.requested_by !== user.id) throw new Error("본인의 요청만 취소할 수 있습니다.");
  if (request.status === "approved") throw new Error("이미 승인된 요청은 취소할 수 없습니다.");

  const { error } = await supabase
    .from("shift_cover_requests")
    .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "shift_cover.cancel",
    p_target_table: "shift_cover_requests",
    p_target_id: requestId,
    p_before_data: request,
    p_after_data: { status: "cancelled" },
  });

  revalidatePath(`/stores/${storeId}/shift-cover`);
}
