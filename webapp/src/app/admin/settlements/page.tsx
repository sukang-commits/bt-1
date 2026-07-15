import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSettlementsForAdmin } from "@/lib/settlements/queries";
import { SETTLEMENT_STATUS_LABEL, WORK_SHIFT_LABEL } from "@/lib/settlements/types";
import type { SettlementStatusEnum } from "@/types/database";

export default async function AdminSettlementsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; status?: string; from?: string; to?: string }>;
}) {
  const { storeId, status, from, to } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const [settlements, { data: stores }] = await Promise.all([
    listSettlementsForAdmin(supabase, {
      storeId,
      status: status as SettlementStatusEnum | undefined,
      from,
      to,
    }),
    supabase.from("stores").select("id, name").order("code"),
  ]);

  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">정산관리</h1>

      <form className="flex flex-wrap items-center gap-2">
        <select name="storeId" defaultValue={storeId ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          <option value="">전체 매장</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          <option value="">전체 상태</option>
          {Object.entries(SETTLEMENT_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={from ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <input type="date" name="to" defaultValue={to ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {settlements.length === 0 ? (
        <EmptyState title="조건에 맞는 정산 내역이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {settlements.map((s) => (
            <Link key={s.id} href={`/admin/settlements/${s.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {storeNameById.get(s.store_id) ?? "-"} · {s.work_date} · {WORK_SHIFT_LABEL[s.work_shift]}
                  </CardTitle>
                  <StatusBadge label={SETTLEMENT_STATUS_LABEL[s.status]} />
                </CardHeader>
                <CardDescription>
                  POS {s.pos_amount.toLocaleString()}원 · 차액{" "}
                  <span className={s.variance !== 0 ? "font-semibold text-warning" : ""}>
                    {s.variance.toLocaleString()}원
                  </span>
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
