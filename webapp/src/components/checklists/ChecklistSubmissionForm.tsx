"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PhotoAttachmentField } from "@/components/forms/PhotoAttachmentField";
import { useToast } from "@/components/providers/ToastProvider";
import { submitChecklist } from "@/lib/checklists/actions";
import { checklistItemPhotoRequirement, isPhotoRequiredNow } from "@/lib/grades/policy";
import type {
  ChecklistItemRow,
  ChecklistItemSubmissionRow,
  ChecklistSubmissionRow,
  EmployeeGradeEnum,
} from "@/types/database";

interface RowState {
  checked: boolean;
  note: string;
  photoId: string | null;
}

export function ChecklistSubmissionForm({
  checklistId,
  storeId,
  userId,
  grade,
  items,
  existingSubmission,
  existingItemSubmissions,
  photoUrls = {},
  readOnly = false,
}: {
  checklistId: string;
  storeId: string;
  userId: string;
  grade: EmployeeGradeEnum;
  items: ChecklistItemRow[];
  existingSubmission: ChecklistSubmissionRow | null;
  existingItemSubmissions: ChecklistItemSubmissionRow[];
  photoUrls?: Record<string, string>;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const initial: Record<string, RowState> = {};
  for (const item of items) {
    const prior = existingItemSubmissions.find((s) => s.checklist_item_id === item.id);
    initial[item.id] = {
      checked: prior?.is_checked ?? false,
      note: prior?.note ?? "",
      photoId: prior?.photo_attachment_id ?? null,
    };
  }
  const [rows, setRows] = useState(initial);

  const checkedCount = Object.values(rows).filter((r) => r.checked).length;
  const progress = items.length === 0 ? 0 : Math.round((checkedCount / items.length) * 100);

  // 제출 완료(submitted/confirmed) 상태에서는 재제출 불가, needs_supplement일 때만 재제출 허용.
  // readOnly(타인의 제출을 검토하는 화면)에서는 상태와 무관하게 항상 잠금 처리합니다.
  const locked = readOnly || existingSubmission?.status === "submitted" || existingSubmission?.status === "confirmed";

  const updateRow = (itemId: string, patch: Partial<RowState>) => {
    setRows((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }));
  };

  const missingRequired = useMemo(
    () => items.filter((i) => i.is_required && !rows[i.id]?.checked),
    [items, rows]
  );

  const handleSubmit = async () => {
    if (missingRequired.length > 0) {
      showToast("완료되지 않은 필수 업무가 있습니다", { variant: "warning" });
      return;
    }

    setSubmitting(true);
    try {
      await submitChecklist(
        checklistId,
        storeId,
        grade,
        items.map((item) => ({
          itemId: item.id,
          isCore: item.is_core,
          isRequired: item.is_required,
          checked: rows[item.id]?.checked ?? false,
          photoAttachmentId: rows[item.id]?.photoId ?? null,
          note: rows[item.id]?.note || null,
        }))
      );
      showToast("체크리스트를 제출했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("제출에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface p-3">
        <span className="text-sm font-medium text-ink">진행률</span>
        <span className="text-base font-bold text-brand-dark">{progress}%</span>
      </div>

      {existingSubmission?.status === "needs_supplement" && existingSubmission.review_note && (
        <div className="rounded-xl bg-warning-bg p-3 text-sm text-warning">
          보완 요청: {existingSubmission.review_note}
        </div>
      )}

      {locked && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <StatusBadge label="제출완료" /> 이미 제출된 체크리스트입니다.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const row = rows[item.id];
          const requirement = checklistItemPhotoRequirement(grade, item.is_core);
          const photoNeeded = isPhotoRequiredNow(requirement, row.note.trim().length > 0);
          const showPhoto = requirement !== "none" && item.requires_photo;

          return (
            <div key={item.id} className="rounded-xl border border-border bg-surface p-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5"
                  checked={row.checked}
                  disabled={locked}
                  onChange={(e) => updateRow(item.id, { checked: e.target.checked })}
                />
                <div className="flex-1">
                  <p className="font-medium text-ink">
                    {item.label}
                    {item.is_required && <span className="ml-1 text-danger">*</span>}
                    {item.is_core && <span className="ml-1 text-xs text-warning">핵심</span>}
                  </p>
                  {item.description && <p className="text-sm text-muted">{item.description}</p>}
                </div>
              </label>

              {!locked && (
                <div className="mt-2 flex flex-col gap-2 pl-8">
                  <textarea
                    placeholder="특이사항 (선택)"
                    rows={2}
                    className="w-full rounded-lg border border-border bg-page p-2 text-sm text-ink"
                    value={row.note}
                    onChange={(e) => updateRow(item.id, { note: e.target.value })}
                  />
                  {showPhoto && (
                    <PhotoAttachmentField
                      label="사진 인증"
                      category="checklist"
                      storeId={storeId}
                      userId={userId}
                      value={row.photoId}
                      onChange={(id) => updateRow(item.id, { photoId: id })}
                      required={photoNeeded}
                    />
                  )}
                </div>
              )}

              {locked && (row.note || row.photoId) && (
                <div className="mt-2 flex flex-col gap-2 pl-8">
                  {row.note && <p className="text-sm text-muted">특이사항: {row.note}</p>}
                  {row.photoId && (
                    <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border">
                      {photoUrls[row.photoId] ? (
                        <Image
                          src={photoUrls[row.photoId]}
                          alt="첨부 사진"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-muted">
                          사진을 불러올 수 없습니다
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!locked && (
        <Button size="lg" loading={submitting} onClick={handleSubmit}>
          일괄 제출
        </Button>
      )}
    </div>
  );
}
