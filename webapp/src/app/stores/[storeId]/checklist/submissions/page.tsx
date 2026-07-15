import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listSubmissionsForAdmin } from "@/lib/checklists/queries";
import { SUBMISSION_STATUS_LABEL } from "@/lib/checklists/types";
import type { ChecklistSubmissionStatusEnum } from "@/types/database";

// senior_manager/deputy_manager/administrator는 /admin/checklists/submissions에서 전체 매장을
// 조회할 수 있지만, store_manager는 /admin/* 접근이 차단되어 있어 자기 매장 제출 현황을 볼
// 경로가 없었습니다. 같은 데이터를 매장 화면 안에서 보여주는 전용 페이지입니다.
export default async function StoreChecklistSubmissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { storeId } = await params;
  const { status } = await searchParams;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const canReview =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);
  if (!canReview) redirect(`/stores/${storeId}/checklist`);

  const supabase = await createServerSupabaseClient();
  const submissions = await listSubmissionsForAdmin(supabase, {
    storeId,
    status: status as ChecklistSubmissionStatusEnum | undefined,
  });

  const profileIds = [...new Set(submissions.map((s) => s.profile_id))];
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, name").in("id", profileIds)
    : { data: [] };
  const profileNameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/checklist`} className="text-sm text-muted">
        ← 체크리스트로
      </Link>

      <h1 className="text-xl font-bold text-ink">매장 제출 현황</h1>

      {submissions.length === 0 ? (
        <EmptyState title="제출된 체크리스트가 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <Link
              key={s.id}
              href={`/stores/${storeId}/checklist/${s.checklist_id}?submissionId=${s.id}`}
            >
              <Card>
                <CardHeader>
                  <CardTitle>{profileNameById.get(s.profile_id) ?? "-"}</CardTitle>
                  <StatusBadge label={SUBMISSION_STATUS_LABEL[s.status]} />
                </CardHeader>
                <CardDescription>
                  {s.work_date} · 진행률 {s.progress_rate}%
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
