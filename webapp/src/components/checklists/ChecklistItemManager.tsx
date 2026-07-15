"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { addChecklistItem, deleteChecklistItem } from "@/lib/checklists/actions";
import { WORK_SHIFT_OPTION_LABEL } from "@/lib/checklists/types";
import type { ChecklistItemRow, WorkShiftEnum } from "@/types/database";

export function ChecklistItemManager({
  checklistId,
  items,
}: {
  checklistId: string;
  items: ChecklistItemRow[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [label, setLabel] = useState("");
  const [isRequired, setIsRequired] = useState(true);
  const [requiresPhoto, setRequiresPhoto] = useState(true);
  const [isCore, setIsCore] = useState(false);
  const [workShift, setWorkShift] = useState<WorkShiftEnum | "">("");
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!label.trim()) {
      showToast("업무명을 입력해 주세요", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await addChecklistItem(checklistId, {
        label,
        description: null,
        isRequired,
        requiresPhoto,
        isCore,
        workShift: workShift || null,
        sortOrder: items.length,
      });
      setLabel("");
      showToast("업무를 추가했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("추가에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId, checklistId);
      showToast("업무를 삭제했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("삭제에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <p className="font-semibold text-ink">업무 추가</p>
        <input
          placeholder="업무명"
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-ink"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <select
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-ink"
          value={workShift}
          onChange={(e) => setWorkShift(e.target.value as WorkShiftEnum | "")}
        >
          <option value="">담당 근무 구분 (전체)</option>
          {Object.entries(WORK_SHIFT_OPTION_LABEL).map(([value, label2]) => (
            <option key={value} value={value}>
              {label2}
            </option>
          ))}
        </select>
        <div className="flex flex-wrap gap-3 text-sm text-ink">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} /> 필수
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={requiresPhoto} onChange={(e) => setRequiresPhoto(e.target.checked)} /> 사진 인증 기본값
          </label>
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={isCore} onChange={(e) => setIsCore(e.target.checked)} /> 핵심 업무
          </label>
        </div>
        <Button size="md" loading={submitting} onClick={handleAdd}>
          업무 추가
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
            <div>
              <p className="text-sm font-medium text-ink">
                {item.label} {item.is_core && <span className="text-xs text-warning">핵심</span>}
              </p>
              <p className="text-xs text-muted">
                {item.is_required ? "필수" : "선택"} · {item.requires_photo ? "사진 기본 필요" : "사진 불필요"}
                {item.work_shift && ` · ${WORK_SHIFT_OPTION_LABEL[item.work_shift]}`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="rounded-lg p-2 text-danger hover:bg-danger-bg"
              aria-label="삭제"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
