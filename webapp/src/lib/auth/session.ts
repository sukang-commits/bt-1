import { cache } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SessionUser } from "@/types/domain";

// 로그인 세션(auth.users) + profiles + employee_ranks + 소속 매장을 조합해
// 화면(Header 등)에서 바로 쓸 수 있는 SessionUser로 변환합니다.
// profiles.active가 false(미승인/비활성 계정)면 세션이 없는 것으로 취급합니다.
//
// 거의 모든 페이지에서 호출되는 함수라, 조회를 하나씩 순차적으로(await 후 await)
// 하면 페이지 전환마다 네트워크 왕복이 여러 번 쌓여 체감 속도가 크게 느려집니다.
// profile/rank/소속매장 조회는 서로 의존하지 않으므로 Promise.all로 동시에 보냅니다
// (매장 이름 조회만 소속 매장 id를 알아야 해서 그 다음 단계로 남겨둡니다).
//
// react의 cache()로 감싸서, 같은 요청(같은 페이지 전환) 안에서 layout.tsx와
// page.tsx가 각각 getSessionUser()를 불러도 실제 조회는 한 번만 실행되도록 합니다
// (감싸지 않으면 레이아웃+페이지가 매번 세션 조회를 중복으로 두 번씩 실행했습니다).
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: rank }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("id, name, role, brand_type, active").eq("id", user.id).maybeSingle(),
    supabase.from("employee_ranks").select("grade").eq("profile_id", user.id).maybeSingle(),
    supabase.from("store_members").select("store_id").eq("profile_id", user.id).eq("is_primary", true).maybeSingle(),
  ]);

  if (!profile || !profile.active) return null;

  let storeName: string | null = null;
  if (membership?.store_id) {
    const { data: store } = await supabase.from("stores").select("name").eq("id", membership.store_id).maybeSingle();
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
});

export function homeHrefForRole(user: Pick<SessionUser, "role" | "storeId">): string {
  const isAdmin = ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  if (isAdmin) return "/admin";
  return user.storeId ? `/stores/${user.storeId}` : "/access-denied?reason=no-store";
}
