import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import type { MenuItem } from "@/lib/constants/menu";
import type { SessionUser } from "@/types/domain";

interface AppShellProps {
  user?: SessionUser | null;
  homeHref: string;
  menuItems: MenuItem[];
  sidebarTitle?: string;
  children: ReactNode;
}

export function AppShell({ user, homeHref, menuItems, sidebarTitle, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} homeHref={homeHref} />
      <div className="flex flex-1">
        <Sidebar items={menuItems} sectionTitle={sidebarTitle} />
        <main className="flex-1 px-4 pb-20 pt-4 sm:px-6 md:pb-8">{children}</main>
      </div>
      <MobileBottomNav items={menuItems} />
    </div>
  );
}
