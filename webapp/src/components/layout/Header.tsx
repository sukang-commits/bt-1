"use client";

import Link from "next/link";
import { Bell, LogOut } from "lucide-react";
import type { SessionUser } from "@/types/domain";
import { BRAND_LABELS, GRADE_LABELS, ROLE_LABELS } from "@/types/domain";

interface HeaderProps {
  user?: SessionUser | null;
  homeHref: string;
  onLogout?: () => void;
  notificationCount?: number;
}

export function Header({ user, homeHref, onLogout, notificationCount = 0 }: HeaderProps) {
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

        <button
          type="button"
          aria-label="알림"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-subtle"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger" />
          )}
        </button>

        {user && (
          <button
            type="button"
            onClick={onLogout}
            aria-label="로그아웃"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-subtle"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
}
