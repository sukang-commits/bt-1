import type { ShiftCoverAcceptanceStatusEnum, ShiftCoverStatusEnum } from "@/types/database";

export const SHIFT_COVER_STATUS_LABEL: Record<ShiftCoverStatusEnum, string> = {
  recruiting: "모집중",
  pending_acceptance: "수락자확인중",
  pending_admin_approval: "관리자승인대기",
  approved: "승인완료",
  cancelled: "요청취소",
  closed: "모집종료",
};

export const ACCEPTANCE_STATUS_LABEL: Record<ShiftCoverAcceptanceStatusEnum, string> = {
  pending: "대기중",
  approved: "승인완료",
  rejected: "거절됨",
};
