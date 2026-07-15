import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listSubmissionsForAdmin } from "@/lib/checklists/queries";
import { SUBMISSION_STATUS_LABEL } from "@/lib/checklists/types";
import type { ChecklistSubmissionStatusEnum } from "@/types/database";

export default async function AdminChecklistSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; status?: string }>;
}) {
  const { storeId, status } = await searchParams;
  const supabase = await createServerSupabaseClient();

  const [submissions, { data: stores }] = await Promise.all([
    listSubmissionsForAdmin(supabase, { storeId, status: status as ChecklistSubmissionStatusEnum | undefined }),
    supabase.from("stores").select("id, name"),
  ]);
  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">체크리스트 제출 현황</h1>

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
          {Object.entries(SUBMISSION_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          검색
        </Button>
      </form>

      {submissions.length === 0 ? (
        <EmptyState title="조건에 맞는 제출 내역이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <Link key={s.id} href={`/stores/${s.store_id}/checklist/${s.checklist_id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>{storeNameById.get(s.store_id) ?? "-"}</CardTitle>
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
