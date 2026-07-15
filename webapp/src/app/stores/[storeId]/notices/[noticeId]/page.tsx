import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Card } from "@/components/ui/Card";
import { formatDateTimeKst } from "@/lib/date";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getNoticeAckStats, getNoticeDetail } from "@/lib/notices/queries";
import { markNoticeRead } from "@/lib/notices/actions";

export default async function StoreNoticeDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; noticeId: string }>;
}) {
  const { storeId, noticeId } = await params;
  const supabase = await createServerSupabaseClient();
  const user = await getSessionUser();

  const notice = await getNoticeDetail(supabase, noticeId);
  if (!notice) notFound();

  const { data: readRow } = user
    ? await supabase
        .from("notice_reads")
        .select("read_at")
        .eq("notice_id", noticeId)
        .eq("profile_id", user.id)
        .maybeSingle()
    : { data: null };

  const isManager = user?.role === "store_manager" || (user && ["senior_manager", "deputy_manager", "administrator"].includes(user.role));
  const ackStats = isManager ? await getNoticeAckStats(supabase, notice) : null;

  const markReadWithParams = markNoticeRead.bind(null, noticeId, storeId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <Link href={`/stores/${storeId}/notices`} className="text-sm text-muted">
          ← 공지 목록으로
        </Link>
        {user?.role === "store_manager" && user.storeId === storeId && notice.store_id === storeId && (
          <Link href={`/stores/${storeId}/notices/${noticeId}/edit`} className="text-sm font-medium text-brand-dark">
            수정
          </Link>
        )}
      </div>

      <Card>
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {notice.is_important && <StatusBadge label="중요" />}
          {notice.requires_ack && <StatusBadge label="필수확인" />}
        </div>
        <h1 className="mb-1 text-lg font-bold text-ink">{notice.title}</h1>
        <p className="mb-4 text-xs text-muted">{formatDateTimeKst(notice.publish_at)}</p>
        <p className="whitespace-pre-wrap text-sm text-ink">{notice.content}</p>

        <div className="mt-5 border-t border-border pt-4">
          {readRow ? (
            <p className="flex items-center gap-2 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> {formatDateTimeKst(readRow.read_at)}에 확인했습니다
            </p>
          ) : (
            <form action={markReadWithParams}>
              <Button type="submit" size="lg" className="w-full">
                확인 완료
              </Button>
            </form>
          )}
        </div>
      </Card>

      {ackStats && (
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
      )}
    </div>
  );
}
