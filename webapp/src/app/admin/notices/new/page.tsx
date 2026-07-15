import { NoticeForm } from "@/components/notices/NoticeForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NewAdminNoticePage() {
  const supabase = await createServerSupabaseClient();
  const { data: stores } = await supabase.from("stores").select("id, name").order("code");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">공지 작성</h1>
      <NoticeForm allStores={stores ?? []} listHref="/admin/notices" />
    </div>
  );
}
