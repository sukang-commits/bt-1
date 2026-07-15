"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { calculateCategoryAverage } from "@/lib/qsc/scoring";
import { QSC_ITEMS } from "@/lib/qsc/scoring";

export interface SaveQscScoreInput {
  storeId: string;
  yearMonth: string; // "2026-07"
  itemScores: Record<string, number>; // "quality:음식 품질" -> 95 형태의 키
  adminComment: string | null;
}

export async function saveQscScore(input: SaveQscScoreInput) {
  const user = await getSessionUser();
  if (!user || !["senior_manager", "deputy_manager", "administrator"].includes(user.role)) {
    throw new Error("QSC 점수 입력은 관리자만 할 수 있습니다.");
  }

  const qualityScores = QSC_ITEMS.quality.map((label) => input.itemScores[`quality:${label}`] ?? 0);
  const serviceScores = QSC_ITEMS.service.map((label) => input.itemScores[`service:${label}`] ?? 0);
  const cleanlinessScores = QSC_ITEMS.cleanliness.map((label) => input.itemScores[`cleanliness:${label}`] ?? 0);

  const quality = calculateCategoryAverage(qualityScores);
  const service = calculateCategoryAverage(serviceScores);
  const cleanliness = calculateCategoryAverage(cleanlinessScores);

  const supabase = await createServerSupabaseClient();
  const yearMonthDate = `${input.yearMonth}-01`;

  const { data: before } = await supabase
    .from("qsc_scores")
    .select("*")
    .eq("store_id", input.storeId)
    .eq("year_month", yearMonthDate)
    .maybeSingle();

  const { error } = await supabase.from("qsc_scores").upsert(
    {
      store_id: input.storeId,
      year_month: yearMonthDate,
      quality_score: quality,
      service_score: service,
      cleanliness_score: cleanliness,
      item_scores: input.itemScores,
      admin_comment: input.adminComment,
      created_by: user.id,
    },
    { onConflict: "store_id,year_month" }
  );
  if (error) throw error;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: before ? "qsc_score.update" : "qsc_score.create",
    p_target_table: "qsc_scores",
    p_target_id: input.storeId,
    p_before_data: before,
    p_after_data: { quality, service, cleanliness },
  });

  revalidatePath("/admin/qsc");
  revalidatePath("/admin/scores");
}
