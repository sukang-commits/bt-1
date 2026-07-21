import { redirect } from "next/navigation";
import { AccountRow } from "@/components/accounts/AccountRow";
import { CreateAccountForm } from "@/components/accounts/CreateAccountForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminAccountsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "administrator") {
    redirect("/access-denied?reason=forbidden");
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: profiles }, { data: stores }] = await Promise.all([
    supabase.from("profiles").select("*").order("name"),
    supabase.from("stores").select("id, name").order("code"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">계정 및 권한관리</h1>
        <p className="text-sm text-muted">
          아이디/비밀번호를 발급합니다. 계정을 눌러서 이름·역할·매장·활성화 여부 수정,
          비밀번호 재설정, 삭제까지 할 수 있습니다.
        </p>
      </div>

      <CreateAccountForm stores={stores ?? []} />

      <div className="flex flex-col gap-2">
        {(profiles ?? []).map((p) => (
          <AccountRow
            key={p.id}
            profileId={p.id}
            username={p.username}
            name={p.name}
            role={p.role}
            active={p.active}
          />
        ))}
      </div>
    </div>
  );
}
