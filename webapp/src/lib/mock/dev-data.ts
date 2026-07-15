// 10단계(관리자 통합 페이지)에서 실제 Supabase 조회로 대체될 임시 데이터입니다.
export const MOCK_STORES = Array.from({ length: 16 }, (_, i) => {
  const code = String(i + 1).padStart(2, "0");
  return { id: code, code, name: `${code}호점` };
});
