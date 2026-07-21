import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { getWorkerRankProfile } from "@/lib/ranks/queries";
import { GRADE_LABELS } from "@/types/domain";
import { formatDateTimeKst } from "@/lib/date";

const CHANGE_TYPE_LABEL = { promotion: "승급", demotion: "강등", honor_grant: "명예 등급 부여" } as const;

export default async function MyRankPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createServerSupabaseClient();
  const { rank, history } = await getWorkerRankProfile(supabase, user.id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">내 등급</h1>

      <Card>
        <CardHeader>
          <CardTitle>현재 등급</CardTitle>
          <span className="text-xl font-bold text-brand-dark">
            {rank ? GRADE_LABELS[rank.grade] : "등급 없음"}
          </span>
        </CardHeader>
        {rank && <CardDescription>적용일 {rank.effective_from}</CardDescription>}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>등급 변경 이력</CardTitle>
        </CardHeader>
        {history.length === 0 ? (
          <CardDescription>변경 이력이 없습니다.</CardDescription>
        ) : (
          <ul className="flex flex-col gap-2">
            {history.map((h) => (
              <li key={h.id} className="rounded-xl border border-border p-3 text-sm">
                <p className="font-medium text-ink">
                  {h.previous_grade ? GRADE_LABELS[h.previous_grade] : "없음"} → {GRADE_LABELS[h.new_grade]}{" "}
                  <span className="text-xs text-muted">({CHANGE_TYPE_LABEL[h.change_type]})</span>
                </p>
                <p className="text-xs text-muted">
                  적용일 {h.effective_date} · {formatDateTimeKst(h.created_at)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
