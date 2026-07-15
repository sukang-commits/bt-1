import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_MENU } from "@/lib/constants/menu";
import { MOCK_ADMIN_SESSION } from "@/lib/mock/dev-data";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // 3단계에서 senior_manager / deputy_manager / administrator 권한 검증으로 대체됩니다.
  return (
    <AppShell
      user={MOCK_ADMIN_SESSION}
      homeHref="/admin"
      menuItems={ADMIN_MENU}
      sidebarTitle="관리자"
    >
      {children}
    </AppShell>
  );
}
