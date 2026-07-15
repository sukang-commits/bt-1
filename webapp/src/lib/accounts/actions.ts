"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import type { UserRoleEnum } from "@/types/database";

async function assertAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "administrator") {
    throw new Error("계정 및 권한 관리는 전체 관리자만 할 수 있습니다.");
  }
  return user;
}

export async function updateAccountRole(profileId: string, role: UserRoleEnum) {
  const user = await assertAdmin();
  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();

  const { error } = await supabase.from("profiles").update({ role }).eq("id", profileId);
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "account.role_change",
    p_target_table: "profiles",
    p_target_id: profileId,
    p_before_data: before,
    p_after_data: { role },
  });

  revalidatePath("/admin/accounts");
}

export async function setAccountActive(profileId: string, active: boolean) {
  const user = await assertAdmin();
  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();

  const { error } = await supabase.from("profiles").update({ active }).eq("id", profileId);
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: active ? "account.activate" : "account.deactivate",
    p_target_table: "profiles",
    p_target_id: profileId,
    p_before_data: before,
    p_after_data: { active },
  });

  revalidatePath("/admin/accounts");
}
