import { redirect } from "next/navigation";
import { NoticeForm } from "@/components/notices/NoticeForm";
import { getSessionUser } from "@/lib/auth/session";

export default async function NewStoreNoticePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();

  if (!user || user.role !== "store_manager" || user.storeId !== storeId) {
    redirect(`/stores/${storeId}/notices`);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">공지 작성</h1>
      <NoticeForm lockedStoreId={storeId} listHref={`/stores/${storeId}/notices`} />
    </div>
  );
}
