"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getSessionUser } from "@/lib/auth/session";
import type { BrandTypeEnum, UserRoleEnum } from "@/types/database";

// 실제 이메일이 없는 근무자도 로그인할 수 있도록, 아이디를 내부 전용 이메일로
// 변환해 Supabase Auth에 저장합니다 (로그인은 lib/auth/login-actions.ts에서 이 이메일로 변환).
const INTERNAL_EMAIL_DOMAIN = "wakidoki.local";
const USERNAME_PATTERN = /^[a-z0-9._-]{3,20}$/;

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

export interface CreateAccountInput {
  username: string;
  password: string;
  name: string;
  role: UserRoleEnum;
  brandType: BrandTypeEnum;
  storeId: string | null;
}

export async function createAccount(input: CreateAccountInput) {
  const user = await assertAdmin();

  const username = input.username.trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("아이디는 영문 소문자/숫자/.-_ 조합 3~20자로 입력해 주세요.");
  }
  if (input.password.length < 4) {
    throw new Error("비밀번호는 4자 이상으로 설정해 주세요.");
  }
  if (!input.name.trim()) {
    throw new Error("이름을 입력해 주세요.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: existing } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (existing) throw new Error("이미 사용 중인 아이디입니다.");

  const admin = createAdminSupabaseClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: `${username}@${INTERNAL_EMAIL_DOMAIN}`,
    password: input.password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    throw new Error(createError?.message ?? "계정 생성에 실패했습니다.");
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: created.user.id,
    username,
    name: input.name.trim(),
    phone: null,
    role: input.role,
    brand_type: input.brandType,
    active: true,
  });
  if (profileError) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw profileError;
  }

  if (input.storeId) {
    const { error: memberError } = await admin.from("store_members").insert({
      store_id: input.storeId,
      profile_id: created.user.id,
      is_primary: true,
    });
    if (memberError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw memberError;
    }
  }

  await admin.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "account.create",
    p_target_table: "profiles",
    p_target_id: created.user.id,
    p_before_data: null,
    p_after_data: { username, name: input.name.trim(), role: input.role, store_id: input.storeId },
  });

  revalidatePath("/admin/accounts");
  return created.user.id;
}

export async function resetAccountPassword(profileId: string, newPassword: string) {
  const user = await assertAdmin();
  if (newPassword.length < 4) {
    throw new Error("비밀번호는 4자 이상으로 설정해 주세요.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.updateUserById(profileId, { password: newPassword });
  if (error) throw error;

  await admin.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "account.reset_password",
    p_target_table: "profiles",
    p_target_id: profileId,
    p_before_data: null,
    p_after_data: null,
  });
}

export interface UpdateAccountDetailsInput {
  name: string;
  brandType: BrandTypeEnum;
  storeId: string | null;
}

export async function updateAccountDetails(profileId: string, input: UpdateAccountDetailsInput) {
  const user = await assertAdmin();
  if (!input.name.trim()) throw new Error("이름을 입력해 주세요.");

  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("profiles").select("*").eq("id", profileId).maybeSingle();
  if (!before) throw new Error("계정을 찾을 수 없습니다.");

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name: input.name.trim(), brand_type: input.brandType })
    .eq("id", profileId);
  if (profileError) throw profileError;

  // 소속 매장은 항상 하나만 유지합니다 (기존 배정을 지우고 새로 지정한 매장으로 교체).
  const { error: deleteMemberError } = await supabase.from("store_members").delete().eq("profile_id", profileId);
  if (deleteMemberError) throw deleteMemberError;

  if (input.storeId) {
    const { error: memberError } = await supabase
      .from("store_members")
      .insert({ store_id: input.storeId, profile_id: profileId, is_primary: true });
    if (memberError) throw memberError;
  }

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "account.update_details",
    p_target_table: "profiles",
    p_target_id: profileId,
    p_before_data: before,
    p_after_data: { name: input.name.trim(), brand_type: input.brandType, store_id: input.storeId },
  });

  revalidatePath("/admin/accounts");
  revalidatePath(`/admin/accounts/${profileId}`);
}

// 완전 삭제는 정산/체크리스트/공지 등 그 계정이 남긴 기록을 참조 무결성 때문에 지울 수 없을 때
// 실패합니다(의도된 동작 — 활동 이력이 있는 퇴사자는 "비활성화"를 사용해야 함). 활동 이력이
// 전혀 없는 실수로 만든 계정 등을 완전히 지우고 싶을 때만 사용하세요.
export async function deleteAccount(profileId: string) {
  const user = await assertAdmin();
  if (profileId === user.id) {
    throw new Error("본인 계정은 삭제할 수 없습니다.");
  }

  const admin = createAdminSupabaseClient();
  const { error } = await admin.auth.admin.deleteUser(profileId);
  if (error) {
    throw new Error(
      "삭제할 수 없습니다. 정산/체크리스트/공지 등 이 계정이 남긴 기록이 있으면 삭제 대신 비활성화를 사용해 주세요."
    );
  }

  await admin.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: "account.delete",
    p_target_table: "profiles",
    p_target_id: profileId,
    p_before_data: null,
    p_after_data: null,
  });

  revalidatePath("/admin/accounts");
}
