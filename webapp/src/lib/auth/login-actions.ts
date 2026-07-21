"use server";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const ADMIN_ROLES = ["senior_manager", "deputy_manager", "administrator"];

// 근무자는 이메일이 아니라 아이디로 로그인합니다. 아이디 → 실제 auth.users.email을
// service-role 클라이언트로 찾아낸 뒤, 그 이메일로 signInWithPassword를 호출합니다.
// 아이디가 없거나 비밀번호가 틀린 경우 모두 같은 에러 메시지를 반환해 아이디 존재 여부가
// 드러나지 않도록 합니다.
export async function loginWithUsername(username: string, password: string) {
  const trimmed = username.trim().toLowerCase();
  if (!trimmed || !password) {
    return { error: "아이디와 비밀번호를 입력해 주세요." } as const;
  }

  const admin = createAdminSupabaseClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, role, active")
    .eq("username", trimmed)
    .maybeSingle();

  if (!profile || !profile.active) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." } as const;
  }

  const { data: authUserData } = await admin.auth.admin.getUserById(profile.id);
  const email = authUserData?.user?.email;
  if (!email) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." } as const;
  }

  const supabase = await createServerSupabaseClient();
  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !signInData.user) {
    return { error: "아이디 또는 비밀번호가 올바르지 않습니다." } as const;
  }

  if (ADMIN_ROLES.includes(profile.role)) {
    return { success: true, name: profile.name, redirectTo: "/admin" } as const;
  }

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("profile_id", profile.id)
    .eq("is_primary", true)
    .maybeSingle();

  return {
    success: true,
    name: profile.name,
    redirectTo: membership?.store_id ? `/stores/${membership.store_id}` : "/access-denied?reason=no-store",
  } as const;
}
