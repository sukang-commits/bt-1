import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listChecklistsForStore, listSubmissionStatusForToday } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL, SUBMISSION_STATUS_LABEL } from "@/lib/checklists/types";
import { todayKst } from "@/lib/date";

export default async function StoreChecklistPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const today = todayKst();
  const checklists = await listChecklistsForStore(supabase, storeId, user.brandType, today);

  const canReview =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);

  const submissionByChecklistId = await listSubmissionStatusForToday(
    supabase,
    checklists.map((c) => c.id),
    user.id,
    today
  );
  const withStatus = checklists.map((checklist) => ({
    checklist,
    submission: submissionByChecklistId.get(checklist.id) ?? null,
  }));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">업무 체크</h1>
        {canReview && (
          <div className="flex flex-col items-end gap-1 text-sm font-medium text-brand-dark">
            <Link href={`/stores/${storeId}/checklist/manage`}>매장 업무 관리 →</Link>
            <Link href={`/stores/${storeId}/checklist/submissions`}>매장 제출 현황 →</Link>
          </div>
        )}
      </div>

      {withStatus.length === 0 ? (
        <EmptyState title="등록된 체크리스트가 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {withStatus.map(({ checklist, submission }) => (
            <Link key={checklist.id} href={`/stores/${storeId}/checklist/${checklist.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {CHECKLIST_TYPE_LABEL[checklist.type]} · {checklist.name}
                  </CardTitle>
                  <StatusBadge label={submission ? SUBMISSION_STATUS_LABEL[submission.status] : "미제출"} />
                </CardHeader>
                {submission && <CardDescription>진행률 {submission.progress_rate}%</CardDescription>}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
