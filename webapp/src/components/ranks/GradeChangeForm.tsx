"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { changeGrade } from "@/lib/ranks/actions";
import { GRADE_OPTIONS_BY_BRAND } from "@/lib/ranks/types";
import { GRADE_LABELS } from "@/types/domain";
import { todayKst } from "@/lib/date";
import type { BrandTypeEnum, EmployeeGradeEnum } from "@/types/database";

export function GradeChangeForm({
  profileId,
  brandType,
  currentGrade,
}: {
  profileId: string;
  brandType: BrandTypeEnum;
  currentGrade: EmployeeGradeEnum | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [newGrade, setNewGrade] = useState<EmployeeGradeEnum>(
    currentGrade ?? GRADE_OPTIONS_BY_BRAND[brandType][0]
  );
  const [reason, setReason] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(todayKst());
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showToast("변경 사유를 입력해 주세요", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await changeGrade({ profileId, newGrade, reason, effectiveDate });
      showToast("등급을 변경했습니다", { variant: "success" });
      setReason("");
      router.refresh();
    } catch (error) {
      showToast("변경에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="font-semibold text-ink">등급 변경</p>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">새 등급</label>
        <select
          className="h-12 w-full rounded-xl border border-border bg-page px-3 text-ink"
          value={newGrade}
          onChange={(e) => setNewGrade(e.target.value as EmployeeGradeEnum)}
        >
          {GRADE_OPTIONS_BY_BRAND[brandType].map((g) => (
            <option key={g} value={g}>
              {GRADE_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">적용 시작일 (즉시 적용은 오늘 날짜)</label>
        <input
          type="date"
          className="h-12 w-full rounded-xl border border-border bg-page px-3 text-ink"
          value={effectiveDate}
          onChange={(e) => setEffectiveDate(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">변경 사유</label>
        <textarea
          rows={2}
          className="w-full rounded-xl border border-border bg-page p-3 text-ink"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Button size="lg" loading={submitting} onClick={handleSubmit}>
        등급 변경 적용
      </Button>
    </div>
  );
}
