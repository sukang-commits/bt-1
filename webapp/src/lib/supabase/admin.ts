import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env";

// service role 키는 RLS를 완전히 우회합니다. 계정 발급(Auth Admin API) 등
// 서버 전용 관리 작업에서만 사용하고, 절대 클라이언트 번들에 포함하지 마세요.
export function createAdminSupabaseClient() {
  return createClient<Database>(getSupabaseUrl(), getSupabaseServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
