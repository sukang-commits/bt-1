import { ChecklistTemplateForm } from "@/components/checklists/ChecklistTemplateForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewChecklistTemplatePage() {
  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("id, name").order("code");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">체크리스트 템플릿 추가</h1>
      <ChecklistTemplateForm stores={stores ?? []} />
    </div>
  );
}
