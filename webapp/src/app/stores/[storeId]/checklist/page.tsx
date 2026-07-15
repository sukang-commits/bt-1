import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listChecklistsForStore, getSubmissionForToday } from "@/lib/checklists/queries";
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
  const checklists = await listChecklistsForStore(supabase, storeId, user.brandType);
  const today = todayKst();

  const withStatus = await Promise.all(
    checklists.map(async (c) => {
      const { submission } = await getSubmissionForToday(supabase, c.id, user.id, today);
      return { checklist: c, submission };
    })
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">업무 체크</h1>

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
