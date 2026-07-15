import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/domain";

// 로그인 세션(auth.users) + profiles + employee_ranks + 소속 매장을 조합해
// 화면(Header 등)에서 바로 쓸 수 있는 SessionUser로 변환합니다.
// profiles.active가 false(미승인/비활성 계정)면 세션이 없는 것으로 취급합니다.
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, role, brand_type, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.active) return null;

  const { data: rank } = await supabase
    .from("employee_ranks")
    .select("grade")
    .eq("profile_id", user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from("store_members")
    .select("store_id")
    .eq("profile_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  let storeName: string | null = null;
  if (membership?.store_id) {
    const { data: store } = await supabase
      .from("stores")
      .select("name")
      .eq("id", membership.store_id)
      .maybeSingle();
    storeName = store?.name ?? null;
  }

  const defaultGrade = profile.brand_type === "pc" ? "silver" : "worker_bee";

  return {
    id: profile.id,
    name: profile.name,
    role: profile.role,
    brandType: profile.brand_type,
    grade: rank?.grade ?? defaultGrade,
    storeId: membership?.store_id ?? null,
    storeName,
  };
}

export function homeHrefForRole(user: Pick<SessionUser, "role" | "storeId">): string {
  const isAdmin = ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  if (isAdmin) return "/admin";
  return user.storeId ? `/stores/${user.storeId}` : "/access-denied?reason=no-store";
}
