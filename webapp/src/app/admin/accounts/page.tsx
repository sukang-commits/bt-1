import { redirect } from "next/navigation";
import { AccountRow } from "@/components/accounts/AccountRow";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminAccountsPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "administrator") {
    redirect("/access-denied?reason=forbidden");
  }

  const supabase = await createServerSupabaseClient();
  const { data: profiles } = await supabase.from("profiles").select("*").order("name");

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">계정 및 권한관리</h1>
        <p className="text-sm text-muted">
          역할 변경과 활성/비활성 처리만 지원합니다. 신규 계정 발급은{" "}
          <code className="rounded bg-subtle px-1 py-0.5">npm run seed:accounts</code> 또는 Supabase Auth Admin
          API를 사용해 주세요.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {(profiles ?? []).map((p) => (
          <AccountRow key={p.id} profileId={p.id} name={p.name} role={p.role} active={p.active} />
        ))}
      </div>
    </div>
  );
}
