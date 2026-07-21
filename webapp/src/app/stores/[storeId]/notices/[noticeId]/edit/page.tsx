import { notFound, redirect } from "next/navigation";
import { NoticeForm } from "@/components/notices/NoticeForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getNoticeDetail } from "@/lib/notices/queries";

export default async function EditStoreNoticePage({
  params,
}: {
  params: Promise<{ storeId: string; noticeId: string }>;
}) {
  const { storeId, noticeId } = await params;
  const user = await getSessionUser();

  if (!user || user.role !== "store_manager" || user.storeId !== storeId) {
    redirect(`/stores/${storeId}/notices/${noticeId}`);
  }

  const supabase = await createServerSupabaseClient();
  const notice = await getNoticeDetail(supabase, noticeId);
  if (!notice || notice.store_id !== storeId) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">공지 수정</h1>
      <NoticeForm
        lockedStoreId={storeId}
        initialData={notice}
        listHref={`/stores/${storeId}/notices/${noticeId}`}
      />
    </div>
  );
}
