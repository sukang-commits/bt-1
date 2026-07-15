export type UserRole =
  | "worker"
  | "store_manager"
  | "senior_manager"
  | "deputy_manager"
  | "administrator";

export type BrandType = "pc" | "beoltoon";

export type PcGrade = "silver" | "gold" | "diamond" | "challenger";
export type BeoltoonGrade = "worker_bee" | "honey_bee" | "queen_bee" | "royal_bee";
export type EmployeeGrade = PcGrade | BeoltoonGrade;

export const ADMIN_ROLES: UserRole[] = [
  "senior_manager",
  "deputy_manager",
  "administrator",
];

export function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  worker: "근무자",
  store_manager: "매장 관리자",
  senior_manager: "선임점장",
  deputy_manager: "대리",
  administrator: "전체 관리자",
};

export const BRAND_LABELS: Record<BrandType, string> = {
  pc: "PC",
  beoltoon: "벌툰",
};

export const GRADE_LABELS: Record<EmployeeGrade, string> = {
  silver: "실버",
  gold: "골드",
  diamond: "다이아",
  challenger: "챌린저",
  worker_bee: "워커비",
  honey_bee: "허니비",
  queen_bee: "퀸비",
  royal_bee: "로열비",
};

export interface SessionUser {
  id: string;
  name: string;
  role: UserRole;
  brandType: BrandType;
  grade: EmployeeGrade;
  storeId: string | null;
  storeName: string | null;
}
