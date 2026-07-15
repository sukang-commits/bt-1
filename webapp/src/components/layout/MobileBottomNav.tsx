"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { MENU_ICONS, type MenuItem } from "@/lib/constants/menu";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  items: MenuItem[];
}

export function MobileBottomNav({ items }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const primaryItems = items.filter((item) => item.primary).slice(0, 4);
  const restItems = items.filter((item) => !primaryItems.includes(item));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
        {primaryItems.map((item) => {
          const active = pathname === item.href;
          const Icon = MENU_ICONS[item.icon];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-brand-dark" : "text-muted"
              )}
            >
              <Icon className="h-6 w-6" />
              {item.label}
            </Link>
          );
        })}
        {restItems.length > 0 && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted"
          >
            <Menu className="h-6 w-6" />
            더보기
          </button>
        )}
      </nav>

      {moreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-end bg-black/40 md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full rounded-t-2xl bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">전체 메뉴</p>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setMoreOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-subtle"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {items.map((item) => {
                const Icon = MENU_ICONS[item.icon];
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl p-2 text-center text-[11px] font-medium",
                      active ? "bg-brand text-brand-ink" : "text-ink hover:bg-subtle"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
