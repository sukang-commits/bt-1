import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "문제가 발생했습니다",
  description = "잠시 후 다시 시도해 주세요.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-danger-bg bg-danger-bg/40 px-6 py-14 text-center",
        className
      )}
    >
      <AlertTriangle className="h-9 w-9 text-danger" strokeWidth={1.5} />
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="max-w-xs text-sm text-muted">{description}</p>
      {onRetry && (
        <Button variant="outline" size="md" className="mt-2" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </div>
  );
}
