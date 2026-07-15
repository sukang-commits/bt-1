"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastViewport, type ToastItem, type ToastVariant } from "@/components/ui/Toast";

interface ToastContextValue {
  showToast: (title: string, options?: { description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback<ToastContextValue["showToast"]>(
    (title, options) => {
      toastCounter += 1;
      const id = `toast-${toastCounter}`;
      const toast: ToastItem = {
        id,
        title,
        description: options?.description,
        variant: options?.variant ?? "info",
      };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
