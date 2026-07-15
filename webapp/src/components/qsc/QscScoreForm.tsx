"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { saveQscScore } from "@/lib/qsc/actions";
import { QSC_ITEMS, calculateCategoryAverage, calculateQscTotal } from "@/lib/qsc/scoring";
import type { QscScoreRow } from "@/types/database";

const CATEGORY_LABEL = { quality: "Quality", service: "Service", cleanliness: "Cleanliness" } as const;

export function QscScoreForm({
  storeId,
  yearMonth,
  initialData,
}: {
  storeId: string;
  yearMonth: string;
  initialData: QscScoreRow | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [comment, setComment] = useState(initialData?.admin_comment ?? "");

  const initialScores: Record<string, number> = (initialData?.item_scores as Record<string, number>) ?? {};
  const [scores, setScores] = useState<Record<string, number>>(initialScores);

  const setScore = (key: string, value: number) => setScores((prev) => ({ ...prev, [key]: value }));

  const categoryAverage = (category: keyof typeof QSC_ITEMS) =>
    calculateCategoryAverage(QSC_ITEMS[category].map((label) => scores[`${category}:${label}`] ?? 0));

  const quality = categoryAverage("quality");
  const service = categoryAverage("service");
  const cleanliness = categoryAverage("cleanliness");
  const qscTotal = calculateQscTotal(quality, service, cleanliness);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveQscScore({ storeId, yearMonth, itemScores: scores, adminComment: comment || null });
      showToast("QSC 점수를 저장했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("저장에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {(Object.keys(QSC_ITEMS) as (keyof typeof QSC_ITEMS)[]).map((category) => (
        <div key={category} className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-ink">{CATEGORY_LABEL[category]}</p>
            <span className="text-sm font-medium text-brand-dark">{categoryAverage(category)}점</span>
          </div>
          <div className="flex flex-col gap-2">
            {QSC_ITEMS[category].map((label) => {
              const key = `${category}:${label}`;
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-ink">{label}</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    className="h-10 w-24 rounded-lg border border-border bg-page px-2 text-right text-ink"
                    value={scores[key] ?? 0}
                    onChange={(e) => setScore(key, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between rounded-xl border border-brand bg-brand/10 p-4">
        <span className="font-semibold text-ink">QSC 총점</span>
        <span className="text-xl font-bold text-brand-dark">{qscTotal}점</span>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">관리자 의견</label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-border bg-surface p-3 text-ink"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <Button size="lg" loading={submitting} onClick={handleSubmit}>
        저장
      </Button>
    </div>
  );
}
