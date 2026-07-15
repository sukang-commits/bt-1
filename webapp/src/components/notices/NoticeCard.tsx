import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTimeKst } from "@/lib/date";
import type { NoticeWithReadState } from "@/lib/notices/types";
import { cn } from "@/lib/utils";

const SCOPE_LABEL: Record<string, string> = {
  store: "매장 공지",
  multi_store: "복수 매장 공지",
  all_stores: "전체 공지",
};

interface NoticeCardProps {
  notice: NoticeWithReadState;
  href: string;
  showStoreScope?: boolean;
}

export function NoticeCard({ notice, href, showStoreScope }: NoticeCardProps) {
  const statusLabel = notice.isOverdue
    ? "확인기한초과"
    : notice.isRead
      ? "확인완료"
      : "미확인";

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col gap-2 rounded-2xl border bg-surface p-4 shadow-sm hover:bg-subtle",
        notice.is_important ? "border-brand" : "border-border",
        !notice.isRead && "ring-1 ring-warning/30"
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        {notice.is_important && <StatusBadge label="중요" />}
        {notice.requires_ack && <StatusBadge label="필수확인" />}
        <StatusBadge label={statusLabel} />
        {showStoreScope && <StatusBadge label={SCOPE_LABEL[notice.scope]} tone="neutral" />}
      </div>
      <h3 className="font-semibold text-ink">{notice.title}</h3>
      <p className="line-clamp-2 text-sm text-muted">{notice.content}</p>
      <div className="flex items-center justify-between text-xs text-muted">
        <span>{formatDateTimeKst(notice.publish_at)}</span>
        {notice.ack_due_at && <span>확인 기한 {formatDateTimeKst(notice.ack_due_at)}</span>}
      </div>
    </Link>
  );
}
