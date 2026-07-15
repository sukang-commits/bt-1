import type { EmployeeGradeEnum } from "@/types/database";

// 등급별 인증 정책 (0단계 전체 지침 기준)
//   실버/워커비   : 전체 업무 체크 + 전체 사진 인증
//   골드/허니비   : 핵심 업무만 사진, 나머지는 체크
//   다이아/퀸비   : 전체 업무 체크만 진행 (핵심 항목만 예외적으로 사진 유지)
//   챌린저/로열비 : 명예 등급 — 최소 체크, 특이사항 발생 시에만 사진 인증
export type PhotoRequirement = "required" | "required_if_core" | "required_if_issue" | "none";

const GRADE_TIER: Record<EmployeeGradeEnum, 1 | 2 | 3 | 4> = {
  silver: 1,
  worker_bee: 1,
  gold: 2,
  honey_bee: 2,
  diamond: 3,
  queen_bee: 3,
  challenger: 4,
  royal_bee: 4,
};

export function isHonorGrade(grade: EmployeeGradeEnum): boolean {
  return GRADE_TIER[grade] === 4;
}

// 체크리스트 항목 하나의 사진 요구사항 (isCore: 정산/사고/시설고장 등 핵심 업무 여부)
export function checklistItemPhotoRequirement(
  grade: EmployeeGradeEnum,
  isCore: boolean
): PhotoRequirement {
  const tier = GRADE_TIER[grade];
  if (tier === 1) return "required";
  if (tier === 2) return isCore ? "required" : "none";
  if (tier === 3) return isCore ? "required" : "none";
  return isCore ? "required_if_issue" : "none";
}

// 휴게 인증사진: 실버/골드 계열은 필수, 다이아 계열은 불필요, 챌린저/로열비는
// 특이사항을 입력한 경우에만 필요합니다.
export function breakPhotoRequirement(grade: EmployeeGradeEnum): PhotoRequirement {
  const tier = GRADE_TIER[grade];
  if (tier === 1 || tier === 2) return "required";
  if (tier === 3) return "none";
  return "required_if_issue";
}

export function isPhotoRequiredNow(requirement: PhotoRequirement, hasIssueNote: boolean): boolean {
  if (requirement === "required") return true;
  if (requirement === "required_if_issue") return hasIssueNote;
  return false;
}
