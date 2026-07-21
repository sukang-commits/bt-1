import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SHIFT_COVER_STATUS_LABEL } from "@/lib/shift-cover/types";
import type { ShiftCoverRequestRow } from "@/types/database";

export function ShiftCoverCard({ request, href }: { request: ShiftCoverRequestRow; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 shadow-sm hover:bg-subtle"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {request.is_urgent && <StatusBadge label="긴급" tone="danger" />}
          <StatusBadge label={SHIFT_COVER_STATUS_LABEL[request.status]} />
        </div>
        <span className="text-xs text-muted">
          {request.start_time.slice(0, 5)} ~ {request.end_time.slice(0, 5)}
        </span>
      </div>
      <p className="font-semibold text-ink">{request.work_date}{request.position && ` · ${request.position}`}</p>
      {request.reason && <p className="line-clamp-2 text-sm text-muted">{request.reason}</p>}
    </Link>
  );
}
