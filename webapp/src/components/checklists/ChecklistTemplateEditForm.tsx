"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { updateChecklistTemplate } from "@/lib/checklists/actions";

export function ChecklistTemplateEditForm({
  checklistId,
  initialName,
  initialActive,
}: {
  checklistId: string;
  initialName: string;
  initialActive: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("템플릿 이름을 입력해 주세요", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      await updateChecklistTemplate(checklistId, { name, active });
      showToast("템플릿 정보를 저장했습니다", { variant: "success" });
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
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="font-semibold text-ink">템플릿 정보</p>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">템플릿 이름</label>
        <input
          className="h-12 w-full rounded-xl border border-border bg-page px-3 text-ink"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" className="h-5 w-5" checked={active} onChange={(e) => setActive(e.target.checked)} />
        사용 중 (해제하면 근무자 화면에 노출되지 않습니다)
      </label>
      <Button size="md" loading={submitting} onClick={handleSubmit}>
        저장
      </Button>
    </div>
  );
}
