import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_STORES } from "@/lib/mock/dev-data";

const SUMMARY_CARDS = [
  { label: "전체 매장 수", value: `${MOCK_STORES.length}개` },
  { label: "오늘 미확인 공지 수", value: "7건" },
  { label: "정산 미제출 건수", value: "3건" },
  { label: "정산 차액 발생 건수", value: "1건" },
  { label: "휴게 미인증 건수", value: "2건" },
  { label: "현재 휴게 중 인원", value: "5명" },
  { label: "대타 승인 대기 건수", value: "4건" },
  { label: "체크리스트 미완료 건수", value: "6건" },
];

const STORE_ROWS = MOCK_STORES.slice(0, 6).map((store, i) => ({
  ...store,
  today: 80 + i,
  weekly: 85 + i,
  monthly: 82 + i,
  qsc: 90 + i,
  total: 88 + i,
  status: i % 4 === 0 ? "우수" : i % 4 === 1 ? "정상" : i % 4 === 2 ? "개선필요" : "집중관리",
}));

export default function AdminOverviewPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">통합현황</h1>
        <p className="text-sm text-muted">
          16개 매장 현황 요약입니다. (10단계에서 실제 데이터·필터로 대체됩니다)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SUMMARY_CARDS.map((item) => (
          <Card key={item.label} className="p-3">
            <p className="text-xs text-muted">{item.label}</p>
            <p className="mt-1 text-lg font-bold text-ink">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>16개 매장 통합 현황</CardTitle>
        </CardHeader>
        <CardDescription className="mb-3">일부 매장만 예시로 표시했습니다.</CardDescription>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="py-2 pr-3 font-medium">매장명</th>
                <th className="py-2 pr-3 font-medium">오늘 수행도</th>
                <th className="py-2 pr-3 font-medium">주간 수행도</th>
                <th className="py-2 pr-3 font-medium">월 달성률</th>
                <th className="py-2 pr-3 font-medium">QSC 점수</th>
                <th className="py-2 pr-3 font-medium">총합점수</th>
                <th className="py-2 pr-3 font-medium">상태</th>
              </tr>
            </thead>
            <tbody>
              {STORE_ROWS.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="py-2 pr-3 font-medium text-ink">{row.name}</td>
                  <td className="py-2 pr-3 text-ink">{row.today}%</td>
                  <td className="py-2 pr-3 text-ink">{row.weekly}%</td>
                  <td className="py-2 pr-3 text-ink">{row.monthly}%</td>
                  <td className="py-2 pr-3 text-ink">{row.qsc}</td>
                  <td className="py-2 pr-3 text-ink">{row.total}</td>
                  <td className="py-2 pr-3">
                    <StatusBadge label={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
