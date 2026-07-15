import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getWorkerMenu } from "@/lib/constants/menu";
import { getSessionUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;

  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createServerSupabaseClient();
  // RLS(is_admin() or is_member_of_store)가 그대로 매장 접근 권한을 검증합니다.
  // 소속되지 않은 매장이면 RLS가 행을 감춰 store가 null이 되고, 아래에서 안내 화면으로 보냅니다.
  const { data: store } = await supabase
    .from("stores")
    .select("id, name")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) redirect("/access-denied?reason=store-mismatch");

  return (
    <AppShell
      user={{ ...user, storeId: store.id, storeName: store.name }}
      homeHref={`/stores/${store.id}`}
      menuItems={getWorkerMenu(store.id)}
      sidebarTitle={store.name}
    >
      {children}
    </AppShell>
  );
}
