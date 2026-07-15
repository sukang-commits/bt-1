import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSettlementsForAdmin, listSettlementsForWorker } from "@/lib/settlements/queries";
import { SETTLEMENT_STATUS_LABEL, WORK_SHIFT_LABEL } from "@/lib/settlements/types";

export default async function StoreSettlementsPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  const supabase = await createServerSupabaseClient();

  // store_manager 이상은 /admin/settlements(관리자 전용 라우트)에 접근할 수 없으므로,
  // 본인 매장 정산을 검토할 유일한 경로가 이 화면입니다 — 자기 정산만이 아니라
  // 매장 전체 정산을 보여줘야 합니다.
  const canReview =
    user &&
    (["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
      (user.role === "store_manager" && user.storeId === storeId));

  const settlements = !user
    ? []
    : canReview
      ? await listSettlementsForAdmin(supabase, { storeId })
      : await listSettlementsForWorker(supabase, storeId, user.id);

  let profileNameById = new Map<string, string>();
  if (canReview && settlements.length > 0) {
    const profileIds = [...new Set(settlements.map((s) => s.profile_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", profileIds);
    profileNameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));
  }

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
                    {canReview && `${profileNameById.get(s.profile_id) ?? "-"} · `}
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
