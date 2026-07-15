"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { reviewChecklistSubmission } from "@/lib/checklists/actions";

export function ChecklistReviewPanel({ submissionId, storeId }: { submissionId: string; storeId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const run = async (action: "confirm" | "needs_supplement") => {
    if (action === "needs_supplement" && note.trim().length === 0) {
      showToast("보완 요청 사유를 입력해 주세요", { variant: "warning" });
      return;
    }
    setLoading(action);
    try {
      await reviewChecklistSubmission(submissionId, storeId, action, note || null);
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
      <p className="font-semibold text-ink">관리자 검토</p>
      <textarea
        placeholder="보완 요청 시 사유를 입력하세요"
        rows={2}
        className="w-full rounded-xl border border-border bg-page p-3 text-sm text-ink"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <Button size="md" loading={loading === "confirm"} onClick={() => run("confirm")}>
          확인 완료
        </Button>
        <Button size="md" variant="danger" loading={loading === "needs_supplement"} onClick={() => run("needs_supplement")}>
          보완 요청
        </Button>
      </div>
    </div>
  );
}
