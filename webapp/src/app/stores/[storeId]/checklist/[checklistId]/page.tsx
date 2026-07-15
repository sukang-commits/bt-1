import { notFound } from "next/navigation";
import Link from "next/link";
import { ChecklistSubmissionForm } from "@/components/checklists/ChecklistSubmissionForm";
import { ChecklistReviewPanel } from "@/components/checklists/ChecklistReviewPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getChecklistWithItems, getSubmissionForToday } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";
import { todayKst } from "@/lib/date";

export default async function ChecklistDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; checklistId: string }>;
}) {
  const { storeId, checklistId } = await params;
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { checklist, items } = await getChecklistWithItems(supabase, checklistId);
  if (!checklist) notFound();

  const { submission, itemSubmissions } = await getSubmissionForToday(
    supabase,
    checklistId,
    user.id,
    todayKst()
  );

  const canReview =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/checklist`} className="text-sm text-muted">
        ← 체크리스트 목록으로
      </Link>

      <h1 className="text-xl font-bold text-ink">
        {CHECKLIST_TYPE_LABEL[checklist.type]} · {checklist.name}
      </h1>

      <ChecklistSubmissionForm
        checklistId={checklistId}
        storeId={storeId}
        userId={user.id}
        grade={user.grade}
        items={items}
        existingSubmission={submission}
        existingItemSubmissions={itemSubmissions}
      />

      {canReview && submission && (
        <ChecklistReviewPanel submissionId={submission.id} storeId={storeId} />
      )}
    </div>
  );
}
