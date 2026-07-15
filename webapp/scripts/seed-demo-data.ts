/**
 * 01호점(PC)을 중심으로 공지/체크리스트/정산/휴게/대타/QSC/주간수행도/월간달성률까지
 * 전 기능을 한 번씩 눈으로 확인할 수 있는 데모 데이터를 채웁니다.
 *
 * 사전 준비: supabase/migrations 전체 + supabase/seed.sql(16개 매장) +
 *           npm run seed:accounts(테스트 계정 5개) 가 먼저 적용되어 있어야 합니다.
 * 실행: npm run seed:demo
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

// 이 스크립트는 1회성 데모 데이터 주입용이라, 조회 실패는 그냥 즉시 예외로 던집니다.
// (data, error) 두 인자를 직접 받아야 T가 정확히 추론됩니다 — {data, error} 객체 하나로
// 감싸서 넘기면 discriminated union인 PostgrestSingleResponse<T>의 실패 분기(data: null) 때문에
// T가 `Row | null`로 넓게 추론되어 버립니다.
function must<T>(data: T | null, error: unknown): T {
  if (error) throw error instanceof Error ? error : new Error(String(error));
  if (data === null) throw new Error("예상한 데이터가 없습니다.");
  return data;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.");
  }

  const admin = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: usersPage, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  const byEmail = new Map(usersPage.users.map((u) => [u.email, u.id]));

  const workerId = byEmail.get("worker@wakidoki.test");
  const storeManagerId = byEmail.get("store-manager@wakidoki.test");
  if (!workerId || !storeManagerId) {
    throw new Error("먼저 `npm run seed:accounts`로 테스트 계정을 생성해 주세요.");
  }

  const store01Res = await admin.from("stores").select("id").eq("code", "01").single();
  const store01 = must(store01Res.data, store01Res.error);
  const store02Res = await admin.from("stores").select("id").eq("code", "02").single();
  const store02 = must(store02Res.data, store02Res.error);
  const storeId = store01.id;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const thisYearMonth = todayStr.slice(0, 7);
  const prevMonthDate = new Date(today);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevYearMonth = prevMonthDate.toISOString().slice(0, 7);

  console.log("1) 공지 생성...");
  const notice1Res = await admin
    .from("notices")
    .insert({
      title: "이번 주 위생 점검 안내",
      content: "이번 주 금요일 위생 점검이 있습니다. 체크리스트를 꼼꼼히 확인해 주세요.",
      scope: "store",
      store_id: storeId,
      is_important: true,
      requires_ack: true,
      created_by: storeManagerId,
    })
    .select("id")
    .single();
  const notice1 = must(notice1Res.data, notice1Res.error);
  await admin.from("notice_reads").insert({ notice_id: notice1.id, profile_id: workerId });

  await admin.from("notices").insert({
    title: "전 매장 공통 안내: 여름철 위생 수칙",
    content: "여름철 식중독 예방을 위해 유통기한 관리에 유의해 주세요.",
    scope: "all_stores",
    store_id: null,
    is_important: false,
    requires_ack: false,
    created_by: storeManagerId,
  });

  const multiNoticeRes = await admin
    .from("notices")
    .insert({
      title: "01/02호점 합동 행사 안내",
      content: "다음 주 두 매장 합동 프로모션이 진행됩니다.",
      scope: "multi_store",
      store_id: null,
      is_important: false,
      requires_ack: false,
      created_by: storeManagerId,
    })
    .select("id")
    .single();
  const multiNotice = must(multiNoticeRes.data, multiNoticeRes.error);
  await admin
    .from("notice_stores")
    .insert([
      { notice_id: multiNotice.id, store_id: storeId },
      { notice_id: multiNotice.id, store_id: store02.id },
    ]);

  console.log("2) 체크리스트 템플릿 생성...");
  const checklistRes = await admin
    .from("checklists")
    .insert({ store_id: storeId, brand_type: "pc", type: "open", name: "오픈 체크리스트" })
    .select("id")
    .single();
  const checklist = must(checklistRes.data, checklistRes.error);

  const itemsInput = [
    { label: "매장 조명/간판 점검", is_required: true, requires_photo: true, is_core: false, sort_order: 0 },
    { label: "냉장고 온도 확인", is_required: true, requires_photo: true, is_core: true, sort_order: 1 },
    { label: "포스기 정상 작동 확인", is_required: true, requires_photo: false, is_core: false, sort_order: 2 },
    { label: "테이블/의자 정리", is_required: false, requires_photo: false, is_core: false, sort_order: 3 },
  ];
  const itemsRes = await admin
    .from("checklist_items")
    .insert(itemsInput.map((i) => ({ checklist_id: checklist.id, description: null, work_shift: "open" as const, ...i })))
    .select("id, is_required");
  const items = must(itemsRes.data, itemsRes.error);

  console.log("3) 체크리스트 제출...");
  const submissionRes = await admin
    .from("checklist_submissions")
    .insert({
      checklist_id: checklist.id,
      store_id: storeId,
      profile_id: workerId,
      work_date: todayStr,
      status: "submitted",
      progress_rate: 75,
      reviewed_by: null,
      reviewed_at: null,
      review_note: null,
    })
    .select("id")
    .single();
  const submission = must(submissionRes.data, submissionRes.error);
  await admin.from("checklist_item_submissions").insert(
    items.map((item, idx) => ({
      submission_id: submission.id,
      checklist_item_id: item.id,
      is_checked: idx < 3,
      photo_attachment_id: null,
      note: null,
    }))
  );

  console.log("4) 정산 데이터 생성...");
  await admin.from("settlements").insert({
    store_id: storeId,
    profile_id: workerId,
    work_date: todayStr,
    work_shift: "close",
    pos_amount: 850000,
    cash_amount: 850000,
    card_confirmed: true,
    note: null,
    photo_attachment_id: null,
    status: "submitted",
    submitted_at: new Date().toISOString(),
    reviewed_by: null,
    reviewed_at: null,
    revision_reason: null,
    extra_fields: { deliveryAppAmount: 120000 },
  });
  await admin.from("settlements").insert({
    store_id: storeId,
    profile_id: workerId,
    work_date: todayStr,
    work_shift: "open",
    pos_amount: 200000,
    cash_amount: 195000,
    card_confirmed: false,
    note: "현금 시재 5,000원 부족 - 확인 중",
    photo_attachment_id: null,
    status: "draft",
    submitted_at: null,
    reviewed_by: null,
    reviewed_at: null,
    revision_reason: null,
    extra_fields: { deliveryAppAmount: 30000 },
  });

  console.log("5) 휴게 기록 생성...");
  const breakStart = new Date();
  breakStart.setHours(breakStart.getHours() - 2);
  const breakEnd = new Date(breakStart);
  breakEnd.setMinutes(breakEnd.getMinutes() + 30);
  await admin.from("breaks").insert({
    store_id: storeId,
    profile_id: workerId,
    work_date: todayStr,
    started_at: breakStart.toISOString(),
    ended_at: breakEnd.toISOString(),
    status: "completed",
    photo_attachment_id: null,
    note: null,
  });

  console.log("6) 대타 요청 생성...");
  await admin.from("shift_cover_requests").insert({
    store_id: storeId,
    requested_by: workerId,
    work_date: todayStr,
    start_time: "18:00",
    end_time: "22:00",
    position: "홀",
    reason: "개인 사정으로 대타를 구합니다.",
    is_urgent: true,
    status: "recruiting",
    cancelled_at: null,
  });

  console.log("7) QSC 점수 생성 (이번 달/전월)...");
  const buildItemScores = (base: number) => ({
    "quality:음식 품질": base,
    "quality:음료 품질": base,
    "quality:레시피 준수": base,
    "quality:상품 제공 상태": base,
    "quality:유통기한 관리": base,
    "service:고객 응대": base,
    "service:근무자 친절도": base,
    "service:주문 처리 속도": base,
    "service:불만 처리": base,
    "service:근무 태도": base,
    "cleanliness:매장 청결": base,
    "cleanliness:주방 청결": base,
    "cleanliness:화장실 청결": base,
    "cleanliness:좌석 및 룸 청결": base,
    "cleanliness:집기 및 기기 관리": base,
  });

  await admin.from("qsc_scores").insert({
    store_id: storeId,
    year_month: `${thisYearMonth}-01`,
    quality_score: 90,
    service_score: 88,
    cleanliness_score: 92,
    item_scores: buildItemScores(90),
    admin_comment: "전반적으로 우수한 상태입니다.",
    created_by: storeManagerId,
  });
  await admin.from("qsc_scores").insert({
    store_id: storeId,
    year_month: `${prevYearMonth}-01`,
    quality_score: 85,
    service_score: 84,
    cleanliness_score: 86,
    item_scores: buildItemScores(85),
    admin_comment: "청결 항목 보완이 필요했습니다.",
    created_by: storeManagerId,
  });

  console.log("8) 주간 수행도 / 월간 달성률 생성...");
  const monday = new Date(today);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  const weekStartDate = monday.toISOString().slice(0, 10);

  for (let d = 0; d < 7; d++) {
    const total = d < 5 ? 10 : 0;
    const completed = d < 5 ? 8 + (d % 3) : 0;
    await admin.from("weekly_performance").insert({
      store_id: storeId,
      profile_id: null,
      week_start_date: weekStartDate,
      day_of_week: d,
      required_tasks_total: total,
      required_tasks_completed: Math.min(completed, total),
    });
  }

  await admin.from("monthly_achievements").insert({
    store_id: storeId,
    year_month: `${thisYearMonth}-01`,
    weekly_performance_rate: 88,
    settlement_rate: 90,
    notice_ack_rate: 75,
    break_auth_rate: 95,
    task_completion_score: 80,
    achievement_rate: 87.1,
    previous_month_diff: 3.6,
    total_score: null,
  });
  await admin.from("monthly_achievements").insert({
    store_id: storeId,
    year_month: `${prevYearMonth}-01`,
    weekly_performance_rate: 82,
    settlement_rate: 88,
    notice_ack_rate: 70,
    break_auth_rate: 90,
    task_completion_score: 78,
    achievement_rate: 83.5,
    previous_month_diff: null,
    total_score: null,
  });

  console.log("\n데모 데이터 생성 완료! worker@wakidoki.test 계정으로 로그인해 01호점 화면을 확인해 보세요.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
