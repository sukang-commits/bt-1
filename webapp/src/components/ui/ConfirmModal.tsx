"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-lg p-1 text-muted hover:bg-subtle"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {description && <p className="mb-5 text-sm text-muted">{description}</p>}
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            className="flex-1"
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
