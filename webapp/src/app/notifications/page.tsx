import { redirect } from "next/navigation";
import Link from "next/link";
import { NotificationList } from "@/components/notifications/NotificationList";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser, homeHrefForRole } from "@/lib/auth/session";
import { listNotifications } from "@/lib/notifications/queries";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createServerSupabaseClient();
  const notifications = await listNotifications(supabase, user.id);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col gap-4 px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">알림</h1>
        <Link href={homeHrefForRole(user)} className="text-sm text-muted">
          홈으로
        </Link>
      </div>

      <NotificationList notifications={notifications} />
    </div>
  );
}
