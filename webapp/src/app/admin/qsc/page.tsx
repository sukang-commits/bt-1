import { Button } from "@/components/ui/Button";
import { QscScoreForm } from "@/components/qsc/QscScoreForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getQscScore } from "@/lib/qsc/queries";
import { currentYearMonthKst } from "@/lib/date";

export default async function AdminQscPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; yearMonth?: string }>;
}) {
  const { storeId, yearMonth } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("id, name").order("code");
  const targetStoreId = storeId ?? stores?.[0]?.id;
  const targetYearMonth = yearMonth ?? currentYearMonthKst();

  const existing = targetStoreId ? await getQscScore(supabase, targetStoreId, targetYearMonth) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">QSC 관리</h1>

      <form className="flex flex-wrap items-center gap-2">
        <select name="storeId" defaultValue={targetStoreId ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="month" name="yearMonth" defaultValue={targetYearMonth} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <Button type="submit" variant="outline">
          조회
        </Button>
      </form>

      {targetStoreId && (
        <QscScoreForm storeId={targetStoreId} yearMonth={targetYearMonth} initialData={existing} />
      )}
    </div>
  );
}
