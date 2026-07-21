"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/providers/ToastProvider";
import { approveAcceptance, cancelShiftCoverRequest, chooseAcceptance } from "@/lib/shift-cover/actions";

export function ChooseAcceptanceButton({
  acceptanceId,
  requestId,
  storeId,
}: {
  acceptanceId: string;
  requestId: string;
  storeId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await chooseAcceptance(acceptanceId, requestId, storeId);
      showToast("수락자를 선택했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("처리에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="md" loading={loading} onClick={handle}>
      이 사람으로 확정
    </Button>
  );
}

export function ApproveAcceptanceButton({
  acceptanceId,
  requestId,
  storeId,
}: {
  acceptanceId: string;
  requestId: string;
  storeId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await approveAcceptance(acceptanceId, requestId, storeId);
      showToast("대타를 승인했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("승인에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="md" loading={loading} onClick={handle}>
      관리자 승인
    </Button>
  );
}

export function CancelRequestButton({ requestId, storeId }: { requestId: string; storeId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await cancelShiftCoverRequest(requestId, storeId);
      showToast("요청을 취소했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("취소에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="danger" size="md" onClick={() => setOpen(true)}>
        요청 취소
      </Button>
      <ConfirmModal
        open={open}
        title="대타 요청을 취소할까요?"
        confirmLabel="취소하기"
        danger
        loading={loading}
        onConfirm={handle}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
