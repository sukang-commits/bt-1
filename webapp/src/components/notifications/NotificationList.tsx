"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateTimeKst } from "@/lib/date";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/notifications/actions";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/types/database";

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [markingAll, setMarkingAll] = useState(false);

  const hasUnread = notifications.some((n) => !n.read_at);

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      router.refresh();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleClick = async (notification: NotificationRow) => {
    if (!notification.read_at) {
      await markNotificationRead(notification.id);
      router.refresh();
    }
  };

  if (notifications.length === 0) {
    return <EmptyState icon={Bell} title="알림이 없습니다" />;
  }

  return (
    <div className="flex flex-col gap-3">
      {hasUnread && (
        <Button variant="outline" size="md" loading={markingAll} onClick={handleMarkAll} className="self-end">
          전체 읽음 처리
        </Button>
      )}

      <div className="flex flex-col gap-2">
        {notifications.map((n) => {
          const content = (
            <div
              className={cn(
                "flex flex-col gap-1 rounded-xl border p-3",
                n.read_at ? "border-border bg-surface" : "border-brand bg-brand/10"
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{n.title}</p>
                {!n.read_at && <span className="h-2 w-2 rounded-full bg-danger" />}
              </div>
              {n.body && <p className="text-sm text-muted">{n.body}</p>}
              <p className="text-xs text-muted">{formatDateTimeKst(n.created_at)}</p>
            </div>
          );

          return n.link_path ? (
            <Link key={n.id} href={n.link_path} onClick={() => handleClick(n)}>
              {content}
            </Link>
          ) : (
            <button key={n.id} type="button" className="text-left" onClick={() => handleClick(n)}>
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}
