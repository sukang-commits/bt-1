import { notFound } from "next/navigation";
import Link from "next/link";
import { ChecklistItemManager } from "@/components/checklists/ChecklistItemManager";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getChecklistWithItems } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";

export default async function AdminChecklistDetailPage({
  params,
}: {
  params: Promise<{ checklistId: string }>;
}) {
  const { checklistId } = await params;
  const supabase = await createServerSupabaseClient();
  const { checklist, items } = await getChecklistWithItems(supabase, checklistId);
  if (!checklist) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/admin/checklists" className="text-sm text-muted">
        ← 체크리스트 관리로
      </Link>
      <h1 className="text-xl font-bold text-ink">
        {CHECKLIST_TYPE_LABEL[checklist.type]} · {checklist.name}
      </h1>
      <ChecklistItemManager checklistId={checklistId} items={items} />
    </div>
  );
}
