export const QSC_ITEMS = {
  quality: ["음식 품질", "음료 품질", "레시피 준수", "상품 제공 상태", "유통기한 관리"],
  service: ["고객 응대", "근무자 친절도", "주문 처리 속도", "불만 처리", "근무 태도"],
  cleanliness: ["매장 청결", "주방 청결", "화장실 청결", "좌석 및 룸 청결", "집기 및 기기 관리"],
} as const;

export type QscCategory = keyof typeof QSC_ITEMS;

function assertScore(name: string, value: number) {
  if (value < 0 || value > 100) throw new Error(`${name} 점수는 0~100 사이여야 합니다.`);
}

export function calculateCategoryAverage(scores: number[]): number {
  if (scores.length === 0) return 0;
  scores.forEach((s) => assertScore("세부 항목", s));
  return Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10;
}

export function calculateQscTotal(quality: number, service: number, cleanliness: number): number {
  assertScore("Quality", quality);
  assertScore("Service", service);
  assertScore("Cleanliness", cleanliness);
  return Math.round(((quality + service + cleanliness) / 3) * 10) / 10;
}

// 총합점수 = QSC 점수 × 0.6 + 월간 달성률 × 0.4
export function calculateTotalScore(qscTotal: number, monthlyAchievementRate: number): number {
  assertScore("QSC", qscTotal);
  assertScore("월간 달성률", monthlyAchievementRate);
  return Math.round((qscTotal * 0.6 + monthlyAchievementRate * 0.4) * 100) / 100;
}

export type TotalScoreGrade = "최우수" | "우수" | "정상" | "개선필요" | "집중관리";

export function totalScoreGrade(score: number): TotalScoreGrade {
  if (score >= 95) return "최우수";
  if (score >= 90) return "우수";
  if (score >= 80) return "정상";
  if (score >= 70) return "개선필요";
  return "집중관리";
}
