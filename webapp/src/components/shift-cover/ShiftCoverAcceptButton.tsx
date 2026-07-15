"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/providers/ToastProvider";
import { acceptShiftCoverRequest } from "@/lib/shift-cover/actions";

export function ShiftCoverAcceptButton({
  requestId,
  storeId,
  hasOverlap,
}: {
  requestId: string;
  storeId: string;
  hasOverlap: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const doAccept = async () => {
    setLoading(true);
    try {
      await acceptShiftCoverRequest(requestId, storeId);
      showToast("수락 신청을 등록했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("수락에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Button size="lg" className="w-full" loading={loading} onClick={() => (hasOverlap ? setConfirmOpen(true) : doAccept())}>
        대타 수락하기
      </Button>
      <ConfirmModal
        open={confirmOpen}
        title="같은 날짜에 이미 수락한 대타가 있어요"
        description="같은 시간대에 중복으로 근무하게 될 수 있습니다. 그래도 수락할까요?"
        confirmLabel="그래도 수락"
        loading={loading}
        onConfirm={doAccept}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  );
}
