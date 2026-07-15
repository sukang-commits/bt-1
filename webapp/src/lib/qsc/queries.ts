import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { calculateTotalScore } from "@/lib/qsc/scoring";
import { calculatePreviousPeriodDiff, previousYearMonth } from "@/lib/performance/monthly";

type Client = SupabaseClient<Database>;

export async function getQscScore(supabase: Client, storeId: string, yearMonth: string) {
  const { data } = await supabase
    .from("qsc_scores")
    .select("*")
    .eq("store_id", storeId)
    .eq("year_month", `${yearMonth}-01`)
    .maybeSingle();
  return data;
}

export interface StoreTotalScoreRow {
  storeId: string;
  storeName: string;
  qscTotal: number | null;
  monthlyAchievementRate: number | null;
  totalScore: number | null;
  previousTotalScore: number | null;
}

export async function listTotalScoresForAllStores(
  supabase: Client,
  yearMonth: string
): Promise<StoreTotalScoreRow[]> {
  const { data: stores } = await supabase.from("stores").select("id, name").order("code");
  if (!stores) return [];

  const prevYearMonth = previousYearMonth(yearMonth);

  const rows = await Promise.all(
    stores.map(async (store) => {
      const [{ data: qsc }, { data: achievement }, { data: prevQsc }, { data: prevAchievement }] =
        await Promise.all([
          supabase.from("qsc_scores").select("qsc_total").eq("store_id", store.id).eq("year_month", `${yearMonth}-01`).maybeSingle(),
          supabase.from("monthly_achievements").select("achievement_rate").eq("store_id", store.id).eq("year_month", `${yearMonth}-01`).maybeSingle(),
          supabase.from("qsc_scores").select("qsc_total").eq("store_id", store.id).eq("year_month", `${prevYearMonth}-01`).maybeSingle(),
          supabase.from("monthly_achievements").select("achievement_rate").eq("store_id", store.id).eq("year_month", `${prevYearMonth}-01`).maybeSingle(),
        ]);

      const totalScore =
        qsc && achievement ? calculateTotalScore(qsc.qsc_total, achievement.achievement_rate) : null;
      const previousTotalScore =
        prevQsc && prevAchievement
          ? calculateTotalScore(prevQsc.qsc_total, prevAchievement.achievement_rate)
          : null;

      return {
        storeId: store.id,
        storeName: store.name,
        qscTotal: qsc?.qsc_total ?? null,
        monthlyAchievementRate: achievement?.achievement_rate ?? null,
        totalScore,
        previousTotalScore,
      };
    })
  );

  return rows.sort((a, b) => (b.totalScore ?? -1) - (a.totalScore ?? -1));
}

export function diffFromPrevious(current: number | null, previous: number | null) {
  if (current === null) return null;
  return calculatePreviousPeriodDiff(current, previous);
}
