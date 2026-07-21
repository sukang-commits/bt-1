import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listShiftCoverRequestsForAdmin } from "@/lib/shift-cover/queries";
import { SHIFT_COVER_STATUS_LABEL } from "@/lib/shift-cover/types";

export default async function AdminShiftCoverPage() {
  const supabase = await createServerSupabaseClient();
  const [requests, { data: stores }] = await Promise.all([
    listShiftCoverRequestsForAdmin(supabase),
    supabase.from("stores").select("id, name"),
  ]);
  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));

  const pendingApproval = requests.filter((r) => r.status === "pending_admin_approval");
  const others = requests.filter((r) => r.status !== "pending_admin_approval");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">대타관리</h1>

      {pendingApproval.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>관리자 승인 대기</CardTitle>
          </CardHeader>
          <div className="flex flex-col gap-2">
            {pendingApproval.map((r) => (
              <Link
                key={r.id}
                href={`/stores/${r.store_id}/shift-cover/${r.id}`}
                className="flex items-center justify-between rounded-xl border border-warning bg-warning-bg p-3"
              >
                <span className="text-sm text-ink">
                  {storeNameById.get(r.store_id)} · {r.work_date} {r.start_time.slice(0, 5)}~{r.end_time.slice(0, 5)}
                </span>
                <StatusBadge label="관리자승인대기" />
              </Link>
            ))}
          </div>
        </Card>
      )}

      {requests.length === 0 ? (
        <EmptyState title="등록된 대타 요청이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {others.map((r) => (
            <Link key={r.id} href={`/stores/${r.store_id}/shift-cover/${r.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {storeNameById.get(r.store_id)} · {r.work_date}
                  </CardTitle>
                  <StatusBadge label={SHIFT_COVER_STATUS_LABEL[r.status]} />
                </CardHeader>
                <CardDescription>
                  {r.start_time.slice(0, 5)} ~ {r.end_time.slice(0, 5)}
                  {r.position && ` · ${r.position}`}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
