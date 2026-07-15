import type { SettlementRow, SettlementStatusEnum, WorkShiftEnum } from "@/types/database";

export type { SettlementRow, SettlementStatusEnum, WorkShiftEnum };

export const SETTLEMENT_STATUS_LABEL: Record<SettlementStatusEnum, string> = {
  draft: "작성중",
  submitted: "제출완료",
  confirmed: "관리자확인",
  revision_requested: "수정요청",
  completed: "처리완료",
};

export const WORK_SHIFT_LABEL: Record<WorkShiftEnum, string> = {
  open: "오픈",
  middle: "미들",
  close: "마감",
  night: "야간",
};

// 제출 이후 근무자가 다시 손댈 수 있는 상태 (draft: 작성 중, revision_requested: 관리자 재제출 요청)
export const EDITABLE_STATUSES: SettlementStatusEnum[] = ["draft", "revision_requested"];
