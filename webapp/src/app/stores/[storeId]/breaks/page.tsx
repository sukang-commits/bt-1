import { redirect } from "next/navigation";
import { BreakPanel } from "@/components/breaks/BreakPanel";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getActiveBreak, listTodayBreaksForWorker } from "@/lib/breaks/queries";

export default async function StoreBreaksPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const supabase = await createServerSupabaseClient();
  const [activeBreak, todaysBreaks] = await Promise.all([
    getActiveBreak(supabase, storeId, user.id),
    listTodayBreaksForWorker(supabase, storeId, user.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-bold text-ink">휴게 인증</h1>
      <BreakPanel
        storeId={storeId}
        userId={user.id}
        grade={user.grade}
        activeBreak={activeBreak}
        todaysBreaks={todaysBreaks}
      />
    </div>
  );
}
