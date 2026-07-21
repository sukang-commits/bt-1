import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export default function RootNotFound() {
  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <EmptyState
        title="페이지를 찾을 수 없습니다"
        description="주소를 다시 확인하거나 홈으로 이동해 주세요."
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
