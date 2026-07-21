import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

// 서버 컴포넌트 / 서버 액션 / route handler에서 사용하는 Supabase 클라이언트.
// 로그인한 사용자의 세션 쿠키를 그대로 사용하므로 RLS가 해당 사용자 권한으로 적용됩니다.
// Next.js 16부터 cookies()가 비동기이므로 이 함수도 async로 작성합니다.
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 호출된 경우 쿠키를 쓸 수 없습니다.
          // proxy.ts(3단계)에서 세션 갱신을 담당하므로 여기서는 무시합니다.
        }
      },
    },
  });
}
