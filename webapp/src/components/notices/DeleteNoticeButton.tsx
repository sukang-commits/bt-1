"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/providers/ToastProvider";
import { deleteNotice } from "@/lib/notices/actions";

export function DeleteNoticeButton({
  noticeId,
  storeId,
  redirectTo,
}: {
  noticeId: string;
  storeId: string | null;
  redirectTo: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await deleteNotice(noticeId, storeId);
      showToast("공지를 삭제했습니다", { variant: "success" });
      router.push(redirectTo);
      router.refresh();
    } catch (error) {
      showToast("삭제에 실패했습니다", {
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
        <Trash2 className="h-4 w-4" /> 삭제
      </Button>
      <ConfirmModal
        open={open}
        title="공지를 삭제할까요?"
        description="삭제된 공지는 목록에서 더 이상 보이지 않습니다."
        confirmLabel="삭제"
        danger
        loading={loading}
        onConfirm={handleConfirm}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
