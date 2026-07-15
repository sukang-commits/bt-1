import { notFound } from "next/navigation";
import Link from "next/link";
import { ChecklistSubmissionForm } from "@/components/checklists/ChecklistSubmissionForm";
import { ChecklistReviewPanel } from "@/components/checklists/ChecklistReviewPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  getAttachmentSignedUrls,
  getChecklistWithItems,
  getSubmissionById,
  getSubmissionForToday,
} from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";
import { todayKst } from "@/lib/date";

export default async function ChecklistDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string; checklistId: string }>;
  searchParams: Promise<{ submissionId?: string }>;
}) {
  const { storeId, checklistId } = await params;
  const { submissionId } = await searchParams;
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { checklist, items } = await getChecklistWithItems(supabase, checklistId);
  if (!checklist) notFound();

  const canReview =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);

  // 관리자/매장 관리자가 제출 현황 목록에서 특정 제출 건을 열람하는 경우, "오늘의 내 제출"이
  // 아니라 그 submissionId를 그대로 조회합니다 (RLS가 매장 관리자/관리자의 타인 제출 조회를 허용).
  const reviewingOther = Boolean(submissionId && canReview);
  const { submission, itemSubmissions } = reviewingOther
    ? await getSubmissionById(supabase, submissionId!)
    : await getSubmissionForToday(supabase, checklistId, user.id, todayKst());

  const photoIds = itemSubmissions.map((s) => s.photo_attachment_id).filter((id): id is string => Boolean(id));
  const photoUrls = await getAttachmentSignedUrls(supabase, photoIds);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link
        href={reviewingOther ? "/admin/checklists/submissions" : `/stores/${storeId}/checklist`}
        className="text-sm text-muted"
      >
        ← {reviewingOther ? "제출 현황으로" : "체크리스트 목록으로"}
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
        photoUrls={photoUrls}
        readOnly={reviewingOther}
      />

      {canReview && submission && submission.status === "submitted" && (
        <ChecklistReviewPanel submissionId={submission.id} storeId={storeId} />
      )}
    </div>
  );
}
