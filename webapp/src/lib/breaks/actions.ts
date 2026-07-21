"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { todayKst } from "@/lib/date";
import { MAX_NORMAL_BREAK_MINUTES } from "@/lib/breaks/types";

export async function startBreak(storeId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  // storage_path_store_id의 부분 유니크 인덱스(breaks_one_active_per_profile)가
  // "휴게 중 다시 시작 불가"를 DB 레벨에서 강제합니다.
  const { error } = await supabase.from("breaks").insert({
    store_id: storeId,
    profile_id: user.id,
    work_date: todayKst(),
    status: "in_progress",
    ended_at: null,
    photo_attachment_id: null,
    note: null,
  });

  if (error) {
    if (error.code === "23505") throw new Error("이미 휴게 중입니다.");
    throw error;
  }

  revalidatePath(`/stores/${storeId}/breaks`);
  revalidatePath(`/stores/${storeId}`);
}

export async function endBreak(
  breakId: string,
  storeId: string,
  input: { note: string | null; photoAttachmentId: string | null }
) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("breaks")
    .select("started_at, ended_at")
    .eq("id", breakId)
    .maybeSingle();

  if (!existing) throw new Error("휴게 기록을 찾을 수 없습니다.");
  if (existing.ended_at) throw new Error("이미 종료된 휴게 기록입니다.");

  const endedAt = new Date();
  const durationMinutes = (endedAt.getTime() - new Date(existing.started_at).getTime()) / 60000;
  const status = durationMinutes > MAX_NORMAL_BREAK_MINUTES ? "needs_review" : "completed";

  const { error } = await supabase
    .from("breaks")
    .update({
      ended_at: endedAt.toISOString(),
      note: input.note,
      photo_attachment_id: input.photoAttachmentId,
      status,
    })
    .eq("id", breakId);

  if (error) throw error;

  revalidatePath(`/stores/${storeId}/breaks`);
  revalidatePath(`/stores/${storeId}`);
}
