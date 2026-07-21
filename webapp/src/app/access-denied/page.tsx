import Link from "next/link";
import { ShieldAlert, UserX } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

const REASON_COPY: Record<string, { title: string; description: string }> = {
  forbidden: {
    title: "접근 권한이 없습니다",
    description: "이 페이지는 선임점장/대리/전체 관리자만 접근할 수 있습니다.",
  },
  inactive: {
    title: "승인되지 않은 계정입니다",
    description: "관리자에게 계정 활성화를 요청해 주세요.",
  },
  "no-store": {
    title: "배정된 매장이 없습니다",
    description: "관리자에게 소속 매장 배정을 요청해 주세요.",
  },
  "store-mismatch": {
    title: "소속되지 않은 매장입니다",
    description: "본인이 소속된 매장 페이지만 이용할 수 있습니다.",
  },
};

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const copy = REASON_COPY[reason ?? ""] ?? {
    title: "접근할 수 없습니다",
    description: "권한을 확인한 후 다시 시도해 주세요.",
  };

  return (
    <div className="flex flex-1 items-center justify-center bg-page px-4">
      <EmptyState
        icon={reason === "inactive" ? UserX : ShieldAlert}
        title={copy.title}
        description={copy.description}
        action={
          <Link href="/login">
            <Button variant="outline">로그인 화면으로</Button>
          </Link>
        }
        className="w-full max-w-sm"
      />
    </div>
  );
}
