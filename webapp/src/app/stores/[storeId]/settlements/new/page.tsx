import { redirect } from "next/navigation";
import { SettlementForm } from "@/components/settlements/SettlementForm";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewSettlementPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">정산 등록</h1>
      <SettlementForm storeId={storeId} userId={user.id} brandType={user.brandType} />
    </div>
  );
}
