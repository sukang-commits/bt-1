const KST_TIME_ZONE = "Asia/Seoul";

// 워키도키의 모든 날짜/시간은 한국 시간(Asia/Seoul) 기준으로 계산·표시합니다.
export function todayKst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: KST_TIME_ZONE }).format(new Date());
}

export function formatDateTimeKst(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
