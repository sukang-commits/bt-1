import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ADMIN_MENU } from "@/lib/constants/menu";
import { getSessionUser } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/types/domain";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getSessionUser();

  // proxy.ts에서 이미 걸러지지만, 서버 컴포넌트에서도 다시 한번 권한을 검증합니다.
  if (!user) redirect("/login");
  if (!ADMIN_ROLES.includes(user.role)) redirect("/access-denied?reason=forbidden");

  return (
    <AppShell user={user} homeHref="/admin" menuItems={ADMIN_MENU} sidebarTitle="관리자">
      {children}
    </AppShell>
  );
}
