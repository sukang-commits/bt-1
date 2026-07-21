import { cn } from "@/lib/utils";
import { toneForStatus, type StatusTone } from "@/lib/constants/status";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  danger: "bg-danger-bg text-danger",
  info: "bg-info-bg text-info",
  brand: "bg-brand text-brand-ink",
  neutral: "bg-subtle text-muted",
};

interface StatusBadgeProps {
  label: string;
  tone?: StatusTone;
  className?: string;
}

export function StatusBadge({ label, tone, className }: StatusBadgeProps) {
  const resolvedTone = tone ?? toneForStatus(label);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[resolvedTone],
        className
      )}
    >
      {label}
    </span>
  );
}
