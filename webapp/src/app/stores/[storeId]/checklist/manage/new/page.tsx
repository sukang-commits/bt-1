import { redirect } from "next/navigation";
import Link from "next/link";
import { StoreChecklistTemplateForm } from "@/components/checklists/StoreChecklistTemplateForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewStoreChecklistPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const canManage =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);
  if (!canManage) redirect(`/stores/${storeId}/checklist`);

  const supabase = await createServerSupabaseClient();
  const { data: store } = await supabase.from("stores").select("brand_type").eq("id", storeId).maybeSingle();
  if (!store) redirect(`/stores/${storeId}/checklist`);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/checklist/manage`} className="text-sm text-muted">
        ← 매장 업무 관리로
      </Link>
      <h1 className="text-xl font-bold text-ink">새 체크리스트 템플릿</h1>
      <StoreChecklistTemplateForm storeId={storeId} brandType={store.brand_type} />
    </div>
  );
}
