import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AccountDetailForm } from "@/components/accounts/AccountDetailForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getAccountDetail } from "@/lib/accounts/queries";

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const user = await getSessionUser();
  if (!user || user.role !== "administrator") {
    redirect("/access-denied?reason=forbidden");
  }

  const supabase = await createServerSupabaseClient();
  const [{ profile, storeId }, { data: stores }] = await Promise.all([
    getAccountDetail(supabase, profileId),
    supabase.from("stores").select("id, name").order("code"),
  ]);
  if (!profile) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/admin/accounts" className="text-sm text-muted">
        ← 계정 및 권한관리로
      </Link>
      <h1 className="text-xl font-bold text-ink">{profile.name}</h1>
      <AccountDetailForm
        profileId={profile.id}
        username={profile.username}
        initialName={profile.name}
        initialRole={profile.role}
        initialBrandType={profile.brand_type}
        initialActive={profile.active}
        initialStoreId={storeId}
        stores={stores ?? []}
      />
    </div>
  );
}
