"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

// 브라우저(클라이언트 컴포넌트)에서 사용하는 Supabase 클라이언트.
// anon key만 사용하며, 모든 접근 제어는 RLS 정책이 담당합니다.
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseAnonKey());
}
