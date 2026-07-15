import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";
import { ADMIN_ROLES, type UserRole } from "@/types/domain";

// Next.js 16부터 middleware.ts는 proxy.ts로 이름이 바뀌었습니다 (동작은 동일).
// /stores/*, /admin/* 접근 전에 로그인 여부와 역할을 확인합니다.
// 특정 매장 소속 여부(다른 매장 접근 차단)는 4단계에서 레이아웃 레벨로 보강됩니다.
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let response = NextResponse.next({ request });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !profile.active) {
    return NextResponse.redirect(new URL("/access-denied?reason=inactive", request.url));
  }

  const isAdminRole = (ADMIN_ROLES as UserRole[]).includes(profile.role as UserRole);

  if (pathname.startsWith("/admin") && !isAdminRole) {
    return NextResponse.redirect(new URL("/access-denied?reason=forbidden", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/stores/:path*"],
};
