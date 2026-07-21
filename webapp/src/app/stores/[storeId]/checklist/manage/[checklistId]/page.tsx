import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChecklistItemManager } from "@/components/checklists/ChecklistItemManager";
import { ChecklistTemplateEditForm } from "@/components/checklists/ChecklistTemplateEditForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAttachmentSignedUrls, getChecklistWithItems } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";

export default async function StoreChecklistManageDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; checklistId: string }>;
}) {
  const { storeId, checklistId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const canManage =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);
  if (!canManage) redirect(`/stores/${storeId}/checklist`);

  const supabase = await createServerSupabaseClient();
  const { checklist, items } = await getChecklistWithItems(supabase, checklistId);
  if (!checklist) notFound();

  // 매장 관리자는 자기 매장 전용 템플릿만 수정할 수 있습니다 (브랜드 공통 템플릿은 상위 관리자 전용).
  const isAdmin = ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  if (!isAdmin && checklist.store_id !== storeId) {
    redirect(`/stores/${storeId}/checklist/manage`);
  }

  const exampleIds = items.map((i) => i.example_photo_attachment_id).filter((id): id is string => Boolean(id));
  const examplePhotoUrls = await getAttachmentSignedUrls(supabase, exampleIds);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/checklist/manage`} className="text-sm text-muted">
        ← 매장 업무 관리로
      </Link>
      <h1 className="text-xl font-bold text-ink">
        {CHECKLIST_TYPE_LABEL[checklist.type]} · {checklist.name}
      </h1>
      <ChecklistTemplateEditForm
        checklistId={checklistId}
        type={checklist.type}
        initialName={checklist.name}
        initialActive={checklist.active}
        initialScheduleDayOfWeek={checklist.schedule_day_of_week}
        initialScheduleWeekOfMonth={checklist.schedule_week_of_month}
      />
      <ChecklistItemManager
        checklistId={checklistId}
        storeId={checklist.store_id ?? "global"}
        userId={user.id}
        items={items}
        examplePhotoUrls={examplePhotoUrls}
      />
    </div>
  );
}
