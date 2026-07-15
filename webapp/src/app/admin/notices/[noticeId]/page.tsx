import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { DeleteNoticeButton } from "@/components/notices/DeleteNoticeButton";
import { formatDateTimeKst } from "@/lib/date";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNoticeAckStats, getNoticeDetail } from "@/lib/notices/queries";

export default async function AdminNoticeDetailPage({
  params,
}: {
  params: Promise<{ noticeId: string }>;
}) {
  const { noticeId } = await params;
  const supabase = await createServerSupabaseClient();
  const notice = await getNoticeDetail(supabase, noticeId);
  if (!notice) notFound();

  const ackStats = await getNoticeAckStats(supabase, notice);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href="/admin/notices" className="text-sm text-muted">
          ← 공지관리로
        </Link>
        <div className="flex gap-2">
          <Link href={`/admin/notices/${noticeId}/edit`}>
            <Button variant="outline" size="md">
              수정
            </Button>
          </Link>
          <DeleteNoticeButton noticeId={noticeId} storeId={notice.store_id} redirectTo="/admin/notices" />
        </div>
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {notice.is_important && <StatusBadge label="중요" />}
          {notice.requires_ack && <StatusBadge label="필수확인" />}
        </div>
        <h1 className="mb-1 text-lg font-bold text-ink">{notice.title}</h1>
        <p className="mb-4 text-xs text-muted">{formatDateTimeKst(notice.publish_at)}</p>
        <p className="whitespace-pre-wrap text-sm text-ink">{notice.content}</p>
      </Card>

      <Card>
        <h2 className="mb-3 font-semibold text-ink">
          확인 현황 ({ackStats.ackCount}/{ackStats.targetCount}명, {ackStats.rate}%)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted">확인함</p>
            <ul className="flex flex-col gap-1 text-sm text-ink">
              {ackStats.readers.map((r) => (
                <li key={r.profileId}>
                  {r.name} · {formatDateTimeKst(r.readAt)}
                </li>
              ))}
              {ackStats.readers.length === 0 && <li className="text-muted">없음</li>}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted">미확인</p>
            <ul className="flex flex-col gap-1 text-sm text-ink">
              {ackStats.nonReaders.map((r) => (
                <li key={r.profileId}>{r.name}</li>
              ))}
              {ackStats.nonReaders.length === 0 && <li className="text-muted">없음</li>}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
