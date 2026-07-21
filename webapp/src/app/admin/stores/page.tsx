import { StoreRow } from "@/components/stores/StoreRow";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminStoresPage() {
  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("*").order("code");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">매장관리</h1>
        <p className="text-sm text-muted">매장명을 실제 상호명으로 변경할 수 있습니다.</p>
      </div>

      <div className="flex flex-col gap-2">
        {(stores ?? []).map((s) => (
          <StoreRow key={s.id} storeId={s.id} code={s.code} name={s.name} brandType={s.brand_type} />
        ))}
      </div>
    </div>
  );
}
