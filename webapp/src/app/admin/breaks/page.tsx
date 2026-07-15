import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listBreaksForAdmin } from "@/lib/breaks/queries";
import { BREAK_STATUS_LABEL, MAX_NORMAL_BREAK_MINUTES, isBreakOverdue } from "@/lib/breaks/types";
import { formatDateTimeKst, todayKst } from "@/lib/date";

export default async function AdminBreaksPage({
  searchParams,
}: {
  searchParams: Promise<{ storeId?: string; date?: string }>;
}) {
  const { storeId, date } = await searchParams;
  const targetDate = date ?? todayKst();
  const supabase = await createServerSupabaseClient();

  const [breaks, { data: stores }] = await Promise.all([
    listBreaksForAdmin(supabase, { storeId, date: targetDate }),
    supabase.from("stores").select("id, name").order("code"),
  ]);

  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));
  const inProgress = breaks.filter((b) => b.ended_at === null);
  const overdue = breaks.filter((b) => b.ended_at === null && isBreakOverdue(b.started_at, MAX_NORMAL_BREAK_MINUTES));

  let unusedMembers: { id: string; name: string }[] = [];
  if (storeId) {
    const { data: members } = await supabase
      .from("store_members")
      .select("profile_id")
      .eq("store_id", storeId);
    const memberIds = (members ?? []).map((m) => m.profile_id);

    const { data: profiles } = memberIds.length
      ? await supabase
          .from("profiles")
          .select("id, name")
          .in("id", memberIds)
          .in("role", ["worker", "store_manager"])
          .eq("active", true)
      : { data: [] };

    const usedIds = new Set(breaks.map((b) => b.profile_id));
    unusedMembers = (profiles ?? []).filter((p) => !usedIds.has(p.id));
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-ink">휴게관리</h1>

      <form className="flex flex-wrap items-center gap-2">
        <select name="storeId" defaultValue={storeId ?? ""} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink">
          <option value="">전체 매장</option>
          {(stores ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <input type="date" name="date" defaultValue={targetDate} className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-ink" />
        <Button type="submit" variant="outline">
          조회
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-3">
          <p className="text-xs text-muted">현재 휴게 중</p>
          <p className="mt-1 text-lg font-bold text-ink">{inProgress.length}명</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted">예정 시간 초과</p>
          <p className="mt-1 text-lg font-bold text-warning">{overdue.length}명</p>
        </Card>
        {storeId && (
          <Card className="p-3">
            <p className="text-xs text-muted">휴게 미사용</p>
            <p className="mt-1 text-lg font-bold text-ink">{unusedMembers.length}명</p>
          </Card>
        )}
      </div>

      {storeId && unusedMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>휴게 미사용자</CardTitle>
          </CardHeader>
          <p className="text-sm text-ink">{unusedMembers.map((m) => m.name).join(", ")}</p>
        </Card>
      )}

      {breaks.length === 0 ? (
        <EmptyState title="조건에 맞는 휴게 기록이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {breaks.map((b) => (
            <Card key={b.id}>
              <CardHeader>
                <CardTitle>{storeNameById.get(b.store_id) ?? "-"}</CardTitle>
                <StatusBadge label={BREAK_STATUS_LABEL[b.status]} />
              </CardHeader>
              <CardDescription>
                {formatDateTimeKst(b.started_at)} ~ {b.ended_at ? formatDateTimeKst(b.ended_at) : "진행중"}
                {b.duration_minutes !== null && ` · ${b.duration_minutes}분`}
              </CardDescription>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
