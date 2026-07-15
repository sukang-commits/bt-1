export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

// Central mapping so every feature (notices, settlements, breaks, shift-cover,
// checklists, store health) renders the same status word with the same color.
export const STATUS_TONE: Record<string, StatusTone> = {
  // 공지
  미확인: "warning",
  확인완료: "success",
  확인기한초과: "danger",
  중요: "brand",
  필수확인: "info",

  // 정산
  작성중: "neutral",
  제출완료: "info",
  관리자확인: "success",
  수정요청: "warning",
  처리완료: "success",

  // 휴게
  휴게중: "info",
  휴게완료: "success",
  미사용: "neutral",
  확인필요: "warning",

  // 대타
  모집중: "info",
  수락자확인중: "warning",
  관리자승인대기: "warning",
  승인완료: "success",
  요청취소: "neutral",
  모집종료: "neutral",

  // 매장 상태 / 종합점수 등급
  우수: "success",
  정상: "info",
  개선필요: "warning",
  집중관리: "danger",
  최우수: "success",
};

export function toneForStatus(label: string): StatusTone {
  return STATUS_TONE[label] ?? "neutral";
}
