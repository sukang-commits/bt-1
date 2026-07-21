"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || !["senior_manager", "deputy_manager", "administrator"].includes(user.role)) {
    throw new Error("매장 정보 수정은 관리자만 할 수 있습니다.");
  }
  return user;
}

export async function updateStoreName(storeId: string, name: string) {
  const user = await assertAdmin();
  if (!name.trim()) throw new Error("매장명을 입력해 주세요.");

  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("stores").select("*").eq("id", storeId).maybeSingle();

  const { error } = await supabase.from("stores").update({ name: name.trim() }).eq("id", storeId);
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "store.rename",
    p_target_table: "stores",
    p_target_id: storeId,
    p_before_data: before,
    p_after_data: { name: name.trim() },
  });

  revalidatePath("/admin/stores");
}
