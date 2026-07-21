// 11단계(주간 수행도) 평가 기준을 매장 상태 표시에 공통으로 사용합니다.
//   90% 이상: 우수 / 80~89%: 정상 / 70~79%: 개선 필요 / 70% 미만: 집중 관리
export type StoreHealthStatus = "우수" | "정상" | "개선필요" | "집중관리";

export function storeHealthStatus(rate: number): StoreHealthStatus {
  if (rate >= 90) return "우수";
  if (rate >= 80) return "정상";
  if (rate >= 70) return "개선필요";
  return "집중관리";
}
