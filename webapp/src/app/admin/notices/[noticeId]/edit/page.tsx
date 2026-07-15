import { notFound } from "next/navigation";
import { NoticeForm } from "@/components/notices/NoticeForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNoticeDetail } from "@/lib/notices/queries";

export default async function EditAdminNoticePage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const { noticeId } = await params;
  const supabase = await createServerSupabaseClient();
  const notice = await getNoticeDetail(supabase, noticeId);
  if (!notice) notFound();

  const { data: stores } = await supabase.from("stores").select("id, name").order("code");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">공지 수정</h1>
      <NoticeForm allStores={stores ?? []} initialData={notice} listHref={`/admin/notices/${noticeId}`} />
    </div>
  );
}
