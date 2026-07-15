"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import type { SessionUser } from "@/types/domain";
import { BRAND_LABELS, GRADE_LABELS, ROLE_LABELS } from "@/types/domain";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

interface HeaderProps {
  user?: SessionUser | null;
  homeHref: string;
  notificationCount?: number;
}

export function Header({ user, homeHref, notificationCount = 0 }: HeaderProps) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
      <Link href={homeHref} className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-base">
          🐝
        </span>
        <span className="text-lg font-bold tracking-tight text-ink">워키도키</span>
      </Link>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">
              {user.storeName ? `${user.storeName} · ` : ""}
              {user.name}
            </p>
            <p className="text-xs text-muted">
              {ROLE_LABELS[user.role]} · {BRAND_LABELS[user.brandType]} {GRADE_LABELS[user.grade]}
            </p>
          </div>
        )}

        {user && (
          <Link
            href="/notifications"
            aria-label="알림"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-subtle"
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-medium text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </Link>
        )}

        {user && (
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="로그아웃"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-subtle disabled:opacity-50"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
