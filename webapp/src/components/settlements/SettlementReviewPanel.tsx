"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { reviewSettlement } from "@/lib/settlements/actions";

export function SettlementReviewPanel({
  settlementId,
  storeId,
}: {
  settlementId: string;
  storeId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (action: "confirm" | "complete" | "request_revision") => {
    if (action === "request_revision" && reason.trim().length === 0) {
      showToast("수정 요청 사유를 입력해 주세요", { variant: "warning" });
      return;
    }
    setLoading(action);
    try {
      await reviewSettlement(settlementId, storeId, action, reason);
      showToast("처리했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("처리에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="font-semibold text-ink">관리자 처리</p>
      <textarea
        placeholder="수정 요청 시 사유를 입력하세요"
        rows={2}
        className="w-full rounded-xl border border-border bg-page p-3 text-sm text-ink"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="md" loading={loading === "confirm"} onClick={() => run("confirm")}>
          확인 처리
        </Button>
        <Button size="md" variant="outline" loading={loading === "complete"} onClick={() => run("complete")}>
          처리 완료
        </Button>
        <Button
          size="md"
          variant="danger"
          loading={loading === "request_revision"}
          onClick={() => run("request_revision")}
        >
          수정 요청
        </Button>
      </div>
    </div>
  );
}
