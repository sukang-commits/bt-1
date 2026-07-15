import type { SessionUser } from "@/types/domain";

// 1단계 레이아웃 확인용 임시 데이터. 실제 데이터는 2단계 Supabase 스키마 연동 후 대체됩니다.
export const MOCK_STORES = Array.from({ length: 16 }, (_, i) => {
  const code = String(i + 1).padStart(2, "0");
  return { id: code, code, name: `${code}호점` };
});

export const MOCK_WORKER_SESSION: SessionUser = {
  id: "mock-worker-1",
  name: "김도키",
  role: "worker",
  brandType: "pc",
  grade: "gold",
  storeId: "01",
  storeName: "01호점",
};

export const MOCK_ADMIN_SESSION: SessionUser = {
  id: "mock-admin-1",
  name: "이관리",
  role: "administrator",
  brandType: "pc",
  grade: "challenger",
  storeId: null,
  storeName: null,
};
