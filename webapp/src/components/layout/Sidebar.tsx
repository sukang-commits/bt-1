"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_ICONS, type MenuItem } from "@/lib/constants/menu";
import { cn } from "@/lib/utils";

interface SidebarProps {
  items: MenuItem[];
  sectionTitle?: string;
}

export function Sidebar({ items, sectionTitle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface px-3 py-5 md:block">
      {sectionTitle && (
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {sectionTitle}
        </p>
      )}
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = MENU_ICONS[item.icon];
          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-brand text-brand-ink" : "text-ink hover:bg-subtle"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
