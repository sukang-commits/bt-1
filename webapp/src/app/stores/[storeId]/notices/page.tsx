import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoticeCard } from "@/components/notices/NoticeCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listNoticesForStore } from "@/lib/notices/queries";

export default async function StoreNoticesPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  const supabase = await createServerSupabaseClient();
  const notices = await listNoticesForStore(supabase, storeId, user?.id ?? null);

  const canWrite = user?.role === "store_manager";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">공지사항</h1>
        {canWrite && (
          <Link href={`/stores/${storeId}/notices/new`}>
            <Button size="md">
              <Plus className="h-4 w-4" /> 공지 작성
            </Button>
          </Link>
        )}
      </div>

      {notices.length === 0 ? (
        <EmptyState title="등록된 공지가 없습니다" description="새 공지가 등록되면 이곳에 표시됩니다." />
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} href={`/stores/${storeId}/notices/${notice.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
