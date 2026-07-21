import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShiftCoverCard } from "@/components/shift-cover/ShiftCoverCard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listShiftCoverRequestsForStore } from "@/lib/shift-cover/queries";

export default async function StoreShiftCoverPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const supabase = await createServerSupabaseClient();
  const requests = await listShiftCoverRequestsForStore(supabase, storeId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">대타 구하기</h1>
        <Link href={`/stores/${storeId}/shift-cover/new`}>
          <Button size="md">
            <Plus className="h-4 w-4" /> 대타 요청
          </Button>
        </Link>
      </div>

      {requests.length === 0 ? (
        <EmptyState title="등록된 대타 요청이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <ShiftCoverCard key={r.id} request={r} href={`/stores/${storeId}/shift-cover/${r.id}`} />
          ))}
        </div>
      )}
    </div>
  );
}
