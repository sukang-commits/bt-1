"use client";

import { CheckCircle2, Info, TriangleAlert, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const variantStyles: Record<ToastVariant, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  error: { icon: XCircle, className: "text-danger" },
  warning: { icon: TriangleAlert, className: "text-warning" },
  info: { icon: Info, className: "text-info" },
};

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:top-4">
      {toasts.map((toast) => {
        const { icon: Icon, className } = variantStyles[toast.variant];
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border border-border bg-surface p-3 shadow-lg"
          >
            <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", className)} />
            <div className="flex-1">
              <p className="text-sm font-medium text-ink">{toast.title}</p>
              {toast.description && (
                <p className="text-sm text-muted">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              aria-label="알림 닫기"
              onClick={() => onDismiss(toast.id)}
              className="rounded p-1 text-muted hover:bg-subtle"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
