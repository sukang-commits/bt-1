"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";

export function RecomputeButton({ action }: { action: () => Promise<void> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await action();
      showToast("재계산했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("재계산에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="md" loading={loading} onClick={handle}>
      <RefreshCw className="h-4 w-4" /> 재계산
    </Button>
  );
}
