"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createChecklistTemplate } from "@/lib/checklists/actions";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";
import type { BrandTypeEnum, ChecklistTypeEnum } from "@/types/database";

// 매장 관리자가 자기 매장 전용 체크리스트를 만드는 화면. 관리자용 ChecklistTemplateForm과
// 달리 매장/브랜드를 직접 고를 필요가 없습니다 (현재 매장으로 고정).
export function StoreChecklistTemplateForm({ storeId, brandType }: { storeId: string; brandType: BrandTypeEnum }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ChecklistTypeEnum>("open");

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("템플릿 이름을 입력해 주세요", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const id = await createChecklistTemplate({ storeId, brandType, type, name });
      showToast("템플릿을 생성했습니다", { variant: "success" });
      router.push(`/stores/${storeId}/checklist/manage/${id}`);
    } catch (error) {
      showToast("생성에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">템플릿 이름</label>
        <input
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">체크리스트 종류</label>
        <select
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
          value={type}
          onChange={(e) => setType(e.target.value as ChecklistTypeEnum)}
        >
          {Object.entries(CHECKLIST_TYPE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Button size="lg" loading={submitting} onClick={handleSubmit}>
        템플릿 생성
      </Button>
    </div>
  );
}
