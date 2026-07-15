import type { BreakStatusEnum } from "@/types/database";

// 예정된 휴게 시간(분)을 넘기면 관리자 확인이 필요한 기록으로 표시합니다.
// ("use server" 파일(actions.ts)은 async 함수만 export할 수 있어 상수는 여기 둡니다)
export const MAX_NORMAL_BREAK_MINUTES = 60;

export const BREAK_STATUS_LABEL: Record<BreakStatusEnum, string> = {
  in_progress: "휴게중",
  completed: "휴게완료",
  needs_review: "확인필요",
};

// Date.now()/new Date()는 컴포넌트 렌더 본문에서 직접 호출하면 impure로 간주되어
// eslint(react-hooks/purity)에 걸리므로, 별도 함수로 분리해 호출부에서만 쓰도록 합니다.
export function computeElapsedMinutes(startedAtIso: string): number {
  return Math.floor((Date.now() - new Date(startedAtIso).getTime()) / 60000);
}

export function isBreakOverdue(startedAtIso: string, maxMinutes: number): boolean {
  return computeElapsedMinutes(startedAtIso) > maxMinutes;
}
