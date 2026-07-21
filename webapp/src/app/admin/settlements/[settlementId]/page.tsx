import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SettlementReviewPanel } from "@/components/settlements/SettlementReviewPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSettlementDetail } from "@/lib/settlements/queries";
import { SETTLEMENT_STATUS_LABEL, WORK_SHIFT_LABEL } from "@/lib/settlements/types";

export default async function AdminSettlementDetailPage({
  params,
}: {
  params: Promise<{ settlementId: string }>;
}) {
  const { settlementId } = await params;
  const supabase = await createServerSupabaseClient();
  const settlement = await getSettlementDetail(supabase, settlementId);
  if (!settlement) notFound();

  const [{ data: store }, { data: profile }] = await Promise.all([
    supabase.from("stores").select("name").eq("id", settlement.store_id).maybeSingle(),
    supabase.from("profiles").select("name").eq("id", settlement.profile_id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/admin/settlements" className="text-sm text-muted">
        ← 정산관리로
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            {store?.name} · {profile?.name} · {settlement.work_date} · {WORK_SHIFT_LABEL[settlement.work_shift]}
          </CardTitle>
          <StatusBadge label={SETTLEMENT_STATUS_LABEL[settlement.status]} />
        </CardHeader>
        <CardDescription>
          POS {settlement.pos_amount.toLocaleString()}원 / 현금 {settlement.cash_amount.toLocaleString()}원 / 차액{" "}
          {settlement.variance.toLocaleString()}원 / 카드확인{" "}
          {settlement.card_confirmed ? "완료" : "미완료"}
        </CardDescription>
        {settlement.note && <p className="mt-2 text-sm text-ink">특이사항: {settlement.note}</p>}
      </Card>

      <SettlementReviewPanel settlementId={settlement.id} storeId={settlement.store_id} />
    </div>
  );
}
