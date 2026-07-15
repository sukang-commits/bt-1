import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { todayKst } from "@/lib/date";

type Client = SupabaseClient<Database>;

export async function getActiveBreak(supabase: Client, storeId: string, profileId: string) {
  const { data } = await supabase
    .from("breaks")
    .select("*")
    .eq("store_id", storeId)
    .eq("profile_id", profileId)
    .is("ended_at", null)
    .maybeSingle();
  return data;
}

export async function listTodayBreaksForWorker(supabase: Client, storeId: string, profileId: string) {
  const { data } = await supabase
    .from("breaks")
    .select("*")
    .eq("store_id", storeId)
    .eq("profile_id", profileId)
    .eq("work_date", todayKst())
    .order("started_at", { ascending: false });
  return data ?? [];
}

export interface AdminBreakFilters {
  storeId?: string;
  date?: string;
  profileId?: string;
}

export async function listBreaksForAdmin(supabase: Client, filters: AdminBreakFilters) {
  let query = supabase
    .from("breaks")
    .select("*")
    .order("started_at", { ascending: false });

  if (filters.storeId) query = query.eq("store_id", filters.storeId);
  if (filters.date) query = query.eq("work_date", filters.date);
  if (filters.profileId) query = query.eq("profile_id", filters.profileId);

  const { data } = await query;
  return data ?? [];
}
