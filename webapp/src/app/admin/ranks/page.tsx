import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listWorkersForAdmin } from "@/lib/ranks/queries";
import { GRADE_LABELS, ROLE_LABELS } from "@/types/domain";

export default async function AdminRanksPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { storeId } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const [workers, { data: stores }] = await Promise.all([
    listWorkersForAdmin(supabase, storeId),
    supabase.from("stores").select("id, name").order("code"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">등급관리</h1>

      <form className="flex flex-wrap items-center gap-2">
        <select name="storeId" defaultValue={storeId ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          <option value="">전체 매장</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          필터
        </Button>
      </form>

      {workers.length === 0 ? (
        <EmptyState title="조건에 맞는 근무자가 없습니다" />
      ) : (
        <div className="flex flex-col gap-2">
          {workers.map((w) => (
            <Link key={w.id} href={`/admin/ranks/${w.id}`}>
              <Card className="flex items-center justify-between p-3">
                <div>
                  <p className="font-medium text-ink">{w.name}</p>
                  <p className="text-xs text-muted">{ROLE_LABELS[w.role]}</p>
                </div>
                <span className="text-sm font-semibold text-brand-dark">
                  {w.grade ? GRADE_LABELS[w.grade] : "등급 없음"}
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
