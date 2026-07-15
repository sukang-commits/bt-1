"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { gradeTier, isHonorGrade } from "@/lib/grades/policy";
import type { EmployeeGradeEnum, RankChangeTypeEnum } from "@/types/database";

export interface ChangeGradeInput {
  profileId: string;
  newGrade: EmployeeGradeEnum;
  reason: string;
  effectiveDate: string; // 즉시 적용이면 오늘 날짜, 지정일 적용이면 미래 날짜
}

export async function changeGrade(input: ChangeGradeInput) {
  const user = await getSessionUser();
  if (!user || !["senior_manager", "deputy_manager", "administrator"].includes(user.role)) {
    throw new Error("등급 변경은 관리자만 할 수 있습니다.");
  }

  const supabase = await createServerSupabaseClient();
  const { data: currentRank } = await supabase
    .from("employee_ranks")
    .select("grade")
    .eq("profile_id", input.profileId)
    .maybeSingle();

  const previousGrade = currentRank?.grade ?? null;

  let changeType: RankChangeTypeEnum = "promotion";
  if (isHonorGrade(input.newGrade)) {
    changeType = "honor_grant";
  } else if (previousGrade) {
    changeType = gradeTier(input.newGrade) >= gradeTier(previousGrade) ? "promotion" : "demotion";
  }

  const { error: rankError } = await supabase.from("employee_ranks").upsert(
    {
      profile_id: input.profileId,
      grade: input.newGrade,
      is_honor_grade: isHonorGrade(input.newGrade),
      effective_from: input.effectiveDate,
      updated_by: user.id,
    },
    { onConflict: "profile_id" }
  );
  if (rankError) throw rankError;

  const { error: historyError } = await supabase.from("rank_histories").insert({
    profile_id: input.profileId,
    previous_grade: previousGrade,
    new_grade: input.newGrade,
    change_type: changeType,
    reason: input.reason,
    changed_by: user.id,
    effective_date: input.effectiveDate,
  });
  if (historyError) throw historyError;

  await supabase.rpc("log_audit_event", {
    p_actor_id: user.id,
    p_action: `rank.${changeType}`,
    p_target_table: "employee_ranks",
    p_target_id: input.profileId,
    p_before_data: { grade: previousGrade },
    p_after_data: { grade: input.newGrade },
  });

  revalidatePath(`/admin/ranks/${input.profileId}`);
  revalidatePath("/admin/ranks");
}
