import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { NoticeCard } from "@/components/notices/NoticeCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listNoticesForAdmin } from "@/lib/notices/queries";

export default async function AdminNoticesPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string }>;
}) {
  const { storeId } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const user = await getSessionUser();
  const [notices, { data: stores }] = await Promise.all([
    listNoticesForAdmin(supabase, user?.id ?? null, storeId),
    supabase.from("stores").select("id, name").order("code"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">공지관리</h1>
        <Link href="/admin/notices/new">
          <Button size="md">
            <Plus className="h-4 w-4" /> 공지 작성
          </Button>
        </Link>
      </div>

      <form className="flex items-center gap-2">
        <select
          name="storeId"
          defaultValue={storeId ?? ""}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink"
        >
          <option value="">전체 매장</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          필터 적용
        </Button>
      </form>

      {notices.length === 0 ? (
        <EmptyState title="등록된 공지가 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {notices.map((notice) => (
            <NoticeCard key={notice.id} notice={notice} href={`/admin/notices/${notice.id}`} showStoreScope />
          ))}
        </div>
      )}
    </div>
  );
}
