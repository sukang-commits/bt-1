/**
 * 5개 역할(근무자/매장 관리자/선임점장/대리/전체 관리자) 테스트 계정을 생성합니다.
 * 개발/테스트 환경 전용입니다. 실제 운영 배포 전에는 이 계정들을 반드시 삭제하거나
 * 비밀번호를 교체해 주세요.
 *
 * 사전 준비: supabase/migrations 전체 + supabase/seed.sql(16개 매장)이 이미 적용되어 있어야 합니다.
 * 실행: npm run seed:accounts  (.env.local에 SUPABASE 관련 값이 설정되어 있어야 합니다)
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const TEST_PASSWORD = "Wakidoki!2026";

interface TestAccountSeed {
  email: string;
  name: string;
  role: Database["public"]["Enums"]["user_role"];
  brandType: Database["public"]["Enums"]["brand_type"];
  grade: Database["public"]["Enums"]["employee_grade"];
  storeCode: string | null;
}

const TEST_ACCOUNTS: TestAccountSeed[] = [
  {
    email: "worker@wakidoki.test",
    name: "김근무",
    role: "worker",
    brandType: "pc",
    grade: "silver",
    storeCode: "01",
  },
  {
    email: "store-manager@wakidoki.test",
    name: "박점장",
    role: "store_manager",
    brandType: "pc",
    grade: "gold",
    storeCode: "01",
  },
  {
    email: "senior-manager@wakidoki.test",
    name: "이선임",
    role: "senior_manager",
    brandType: "pc",
    grade: "diamond",
    storeCode: null,
  },
  {
    email: "deputy-manager@wakidoki.test",
    name: "최대리",
    role: "deputy_manager",
    brandType: "beoltoon",
    grade: "queen_bee",
    storeCode: null,
  },
  {
    email: "administrator@wakidoki.test",
    name: "정관리",
    role: "administrator",
    brandType: "pc",
    grade: "challenger",
    storeCode: null,
  },
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다 (.env.local 확인)."
    );
  }

  const admin = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  const existingByEmail = new Map(existing.users.map((u) => [u.email, u]));

  for (const account of TEST_ACCOUNTS) {
    let userId = existingByEmail.get(account.email)?.id;

    if (!userId) {
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: account.email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (createError) throw createError;
      userId = created.user.id;
      console.log(`[생성] ${account.email}`);
    } else {
      console.log(`[기존 계정 재사용] ${account.email}`);
    }

    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      username: account.email.split("@")[0].toLowerCase(),
      name: account.name,
      phone: null,
      role: account.role,
      brand_type: account.brandType,
      active: true,
    });
    if (profileError) throw profileError;

    const { error: rankError } = await admin.from("employee_ranks").upsert(
      {
        profile_id: userId,
        grade: account.grade,
        is_honor_grade: account.grade === "challenger" || account.grade === "royal_bee",
        updated_by: userId,
      },
      { onConflict: "profile_id" }
    );
    if (rankError) throw rankError;

    if (account.storeCode) {
      const { data: store, error: storeError } = await admin
        .from("stores")
        .select("id")
        .eq("code", account.storeCode)
        .single();
      if (storeError) throw storeError;

      const { error: memberError } = await admin.from("store_members").upsert(
        { store_id: store.id, profile_id: userId, is_primary: true },
        { onConflict: "store_id,profile_id" }
      );
      if (memberError) throw memberError;
    }
  }

  console.log("\n테스트 계정 5개 준비 완료. 공통 비밀번호:", TEST_PASSWORD);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
