import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SettlementForm } from "@/components/settlements/SettlementForm";
import { SettlementReviewPanel } from "@/components/settlements/SettlementReviewPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getSettlementDetail } from "@/lib/settlements/queries";
import { EDITABLE_STATUSES, SETTLEMENT_STATUS_LABEL, WORK_SHIFT_LABEL } from "@/lib/settlements/types";

export default async function StoreSettlementDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; settlementId: string }>;
}) {
  const { storeId, settlementId } = await params;
  const user = await getSessionUser();
  const supabase = await createServerSupabaseClient();
  const settlement = await getSettlementDetail(supabase, settlementId);
  if (!settlement) notFound();

  const isOwner = user?.id === settlement.profile_id;
  const canReview =
    user &&
    (["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
      (user.role === "store_manager" && user.storeId === storeId));

  const canEdit = isOwner && EDITABLE_STATUSES.includes(settlement.status);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/settlements`} className="text-sm text-muted">
        ← 정산 목록으로
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>
            {settlement.work_date} · {WORK_SHIFT_LABEL[settlement.work_shift]}
          </CardTitle>
          <StatusBadge label={SETTLEMENT_STATUS_LABEL[settlement.status]} />
        </CardHeader>
        <CardDescription>
          POS {settlement.pos_amount.toLocaleString()}원 / 현금 {settlement.cash_amount.toLocaleString()}원 / 차액{" "}
          {settlement.variance.toLocaleString()}원
        </CardDescription>
        {settlement.note && <p className="mt-2 text-sm text-ink">특이사항: {settlement.note}</p>}
        {settlement.revision_reason && (
          <p className="mt-2 rounded-lg bg-warning-bg p-2 text-sm text-warning">
            수정 요청 사유: {settlement.revision_reason}
          </p>
        )}
      </Card>

      {canEdit && (
        <SettlementForm
          storeId={storeId}
          userId={user!.id}
          brandType={user!.brandType}
          initialData={settlement}
        />
      )}

      {canReview && <SettlementReviewPanel settlementId={settlement.id} storeId={storeId} />}
    </div>
  );
}
