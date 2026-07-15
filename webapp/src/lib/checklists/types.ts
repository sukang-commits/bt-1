import type { ChecklistSubmissionStatusEnum, ChecklistTypeEnum, WorkShiftEnum } from "@/types/database";

export const CHECKLIST_TYPE_LABEL: Record<ChecklistTypeEnum, string> = {
  open: "오픈",
  middle: "미들",
  close: "마감",
  kitchen: "주방",
  hall: "홀",
  settlement: "정산",
  weekly: "주간 업무",
  monthly: "월간 업무",
};

export const SUBMISSION_STATUS_LABEL: Record<ChecklistSubmissionStatusEnum, string> = {
  submitted: "제출완료",
  needs_supplement: "보완요청",
  confirmed: "관리자확인",
};

export const WORK_SHIFT_OPTION_LABEL: Record<WorkShiftEnum, string> = {
  open: "오픈",
  middle: "미들",
  close: "마감",
  night: "야간",
};
