"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export async function markNotificationRead(notificationId: string) {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId);
  if (error) throw error;

  revalidatePath("/notifications");
}

export async function markAllNotificationsRead() {
  const user = await getSessionUser();
  if (!user) throw new Error("로그인이 필요합니다.");

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", user.id)
    .is("read_at", null);
  if (error) throw error;

  revalidatePath("/notifications");
}
