import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingScreen({
  label = "불러오는 중입니다...",
  fullScreen = false,
  className,
}: LoadingScreenProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted",
        fullScreen && "min-h-[60vh]",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand-dark" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
