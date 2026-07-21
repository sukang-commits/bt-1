import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Client = SupabaseClient<Database>;

export async function getAccountDetail(supabase: Client, profileId: string) {
  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", profileId).maybeSingle(),
    supabase.from("store_members").select("store_id").eq("profile_id", profileId).eq("is_primary", true).maybeSingle(),
  ]);

  return { profile, storeId: membership?.store_id ?? null };
}
