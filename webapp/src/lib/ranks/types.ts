import type { BrandTypeEnum, EmployeeGradeEnum } from "@/types/database";

export const GRADE_OPTIONS_BY_BRAND: Record<BrandTypeEnum, EmployeeGradeEnum[]> = {
  pc: ["silver", "gold", "diamond", "challenger"],
  beoltoon: ["worker_bee", "honey_bee", "queen_bee", "royal_bee"],
};
