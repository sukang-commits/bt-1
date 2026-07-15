import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSettlementsForWorker } from "@/lib/settlements/queries";
import { SETTLEMENT_STATUS_LABEL, WORK_SHIFT_LABEL } from "@/lib/settlements/types";

export default async function StoreSettlementsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  const supabase = await createServerSupabaseClient();
  const settlements = user ? await listSettlementsForWorker(supabase, storeId, user.id) : [];

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">정산 인증</h1>
        <Link href={`/stores/${storeId}/settlements/new`}>
          <Button size="md">
            <Plus className="h-4 w-4" /> 정산 등록
          </Button>
        </Link>
      </div>

      {settlements.length === 0 ? (
        <EmptyState title="등록된 정산 내역이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {settlements.map((s) => (
            <Link key={s.id} href={`/stores/${storeId}/settlements/${s.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {s.work_date} · {WORK_SHIFT_LABEL[s.work_shift]}
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
