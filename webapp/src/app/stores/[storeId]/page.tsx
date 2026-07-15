import Link from "next/link";
import { Coffee, Megaphone, Receipt, Repeat2, ClipboardCheck } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_STORES } from "@/lib/mock/dev-data";

const QUICK_ACTIONS = [
  { label: "공지 확인", icon: Megaphone, hrefSuffix: "/notices" },
  { label: "업무 체크", icon: ClipboardCheck, hrefSuffix: "/checklist" },
  { label: "정산 인증", icon: Receipt, hrefSuffix: "/settlements" },
  { label: "휴게 시작", icon: Coffee, hrefSuffix: "/breaks" },
  { label: "대타 요청", icon: Repeat2, hrefSuffix: "/shift-cover" },
];

export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = MOCK_STORES.find((s) => s.id === storeId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">{store?.name} 홈</h1>
        <p className="text-sm text-muted">오늘도 안전하고 즐거운 근무 되세요.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, hrefSuffix }) => (
          <Link
            key={label}
            href={`/stores/${storeId}${hrefSuffix}`}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-center shadow-sm hover:bg-subtle"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/20 text-brand-dark">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-medium text-ink">{label}</span>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 공지</CardTitle>
          <StatusBadge label="미확인" />
        </CardHeader>
        <CardDescription>미확인 공지 2건이 있습니다. (5단계에서 실제 데이터 연동)</CardDescription>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>오늘의 체크리스트</CardTitle>
            <span className="text-sm font-semibold text-brand-dark">60%</span>
          </CardHeader>
          <div className="h-2 w-full overflow-hidden rounded-full bg-subtle">
            <div className="h-full w-3/5 rounded-full bg-brand-dark" />
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>정산 제출 상태</CardTitle>
            <StatusBadge label="제출완료" />
          </CardHeader>
          <CardDescription>오늘 마감 근무 정산이 제출되었습니다.</CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>휴게 사용 상태</CardTitle>
            <StatusBadge label="미사용" />
          </CardHeader>
          <CardDescription>아직 휴게를 사용하지 않았습니다.</CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>모집 중인 대타 요청</CardTitle>
            <span className="text-sm font-semibold text-ink">1건</span>
          </CardHeader>
          <CardDescription>이번 주말 마감 대타를 구하고 있어요.</CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이번 주 수행도</CardTitle>
            <span className="text-sm font-semibold text-ink">92%</span>
          </CardHeader>
          <CardDescription>우수 등급을 유지하고 있습니다.</CardDescription>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>이번 달 달성률</CardTitle>
            <span className="text-sm font-semibold text-ink">88%</span>
          </CardHeader>
          <CardDescription>전월 대비 +3%p 상승했습니다.</CardDescription>
        </Card>
      </div>
    </div>
  );
}
