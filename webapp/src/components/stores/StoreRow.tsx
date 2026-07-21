"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { updateStoreName } from "@/lib/stores/actions";
import { BRAND_LABELS } from "@/types/domain";
import type { BrandTypeEnum } from "@/types/database";

export function StoreRow({
  storeId,
  code,
  name,
  brandType,
}: {
  storeId: string;
  code: string;
  name: string;
  brandType: BrandTypeEnum;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [value, setValue] = useState(name);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (value.trim() === name) return;
    setLoading(true);
    try {
      await updateStoreName(storeId, value);
      showToast("매장명을 변경했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("변경에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      setValue(name);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="font-mono">{code}</span>
        <span>{BRAND_LABELS[brandType]}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          className="h-10 w-40 rounded-lg border border-border bg-page px-2 text-sm text-ink"
          value={value}
          disabled={loading}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button size="md" loading={loading} disabled={value.trim() === name} onClick={handleSave}>
          저장
        </Button>
        <Link href={`/stores/${storeId}`} target="_blank">
          <Button size="md" variant="outline">
            <ExternalLink className="h-4 w-4" /> 매장 화면 보기
          </Button>
        </Link>
      </div>
    </div>
  );
}
