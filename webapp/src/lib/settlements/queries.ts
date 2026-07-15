import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SettlementStatusEnum } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function listSettlementsForWorker(supabase: Client, storeId: string, profileId: string) {
  const { data } = await supabase
    .from("settlements")
    .select("*")
    .eq("store_id", storeId)
    .eq("profile_id", profileId)
    .order("work_date", { ascending: false })
    .order("created_at", { ascending: false });
  return data ?? [];
}

export interface AdminSettlementFilters {
  storeId?: string;
  status?: SettlementStatusEnum;
  from?: string;
  to?: string;
}

export async function listSettlementsForAdmin(supabase: Client, filters: AdminSettlementFilters) {
  let query = supabase.from("settlements").select("*").order("work_date", { ascending: false });

  if (filters.storeId) query = query.eq("store_id", filters.storeId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.from) query = query.gte("work_date", filters.from);
  if (filters.to) query = query.lte("work_date", filters.to);

  const { data } = await query;
  return data ?? [];
}

export async function getSettlementDetail(supabase: Client, id: string) {
  const { data } = await supabase.from("settlements").select("*").eq("id", id).maybeSingle();
  return data;
}
