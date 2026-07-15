import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getWorkerMenu } from "@/lib/constants/menu";
import { MOCK_STORES, MOCK_WORKER_SESSION } from "@/lib/mock/dev-data";

export default async function StoreLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = MOCK_STORES.find((s) => s.id === storeId);

  // 4단계에서 소속 매장 여부에 따른 접근 권한 검증으로 대체됩니다.
  if (!store) notFound();

  const user = { ...MOCK_WORKER_SESSION, storeId: store.id, storeName: store.name };

  return (
    <AppShell
      user={user}
      homeHref={`/stores/${store.id}`}
      menuItems={getWorkerMenu(store.id)}
      sidebarTitle={store.name}
    >
      {children}
    </AppShell>
  );
}
