import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChecklistItemManager } from "@/components/checklists/ChecklistItemManager";
import { ChecklistTemplateEditForm } from "@/components/checklists/ChecklistTemplateEditForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAttachmentSignedUrls, getChecklistWithItems } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";

export default async function AdminChecklistDetailPage({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  const { checklistId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createServerSupabaseClient();
  const { checklist, items } = await getChecklistWithItems(supabase, checklistId);
  if (!checklist) notFound();

  const exampleIds = items.map((i) => i.example_photo_attachment_id).filter((id): id is string => Boolean(id));
  const examplePhotoUrls = await getAttachmentSignedUrls(supabase, exampleIds);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/admin/checklists" className="text-sm text-muted">
        ← 체크리스트 관리로
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
