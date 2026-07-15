"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createChecklistTemplate } from "@/lib/checklists/actions";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";
import { BRAND_LABELS } from "@/types/domain";
import type { BrandTypeEnum, ChecklistTypeEnum } from "@/types/database";

export function ChecklistTemplateForm({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<ChecklistTypeEnum>("open");
  const [brandType, setBrandType] = useState<BrandTypeEnum>("pc");
  const [storeId, setStoreId] = useState<string>("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      showToast("템플릿 이름을 입력해 주세요", { variant: "warning" });
      return;
    }
    setSubmitting(true);
    try {
      const id = await createChecklistTemplate({
        storeId: storeId || null,
        brandType,
        type,
        name,
      });
      showToast("템플릿을 생성했습니다", { variant: "success" });
      router.push(`/admin/checklists/${id}`);
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

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">브랜드</label>
        <select
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
          value={brandType}
          onChange={(e) => setBrandType(e.target.value as BrandTypeEnum)}
        >
          {Object.entries(BRAND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">적용 매장 (선택하지 않으면 공통 템플릿)</label>
        <select
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="">공통 (선택한 브랜드 전체)</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
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
