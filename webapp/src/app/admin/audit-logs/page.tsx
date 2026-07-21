import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatDateTimeKst } from "@/lib/date";

export default async function AdminAuditLogsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const actorIds = Array.from(new Set((logs ?? []).map((l) => l.actor_id).filter((id): id is string => Boolean(id))));
  const { data: actors } = actorIds.length
    ? await supabase.from("profiles").select("id, name").in("id", actorIds)
    : { data: [] };
  const nameById = new Map((actors ?? []).map((a) => [a.id, a.name]));

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-ink">기록 관리 (Audit Log)</h1>
        <p className="text-sm text-muted">공지/정산/대타/등급/체크리스트/계정 등 주요 변경 기록입니다.</p>
      </div>

      {(logs ?? []).length === 0 ? (
        <EmptyState title="기록된 활동이 없습니다" />
      ) : (
        <div className="flex flex-col gap-2">
          {(logs ?? []).map((log) => (
            <Card key={log.id} className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">{log.action}</p>
                <p className="text-xs text-muted">{formatDateTimeKst(log.created_at)}</p>
              </div>
              <p className="text-xs text-muted">
                {log.actor_id ? nameById.get(log.actor_id) ?? "알 수 없음" : "시스템"} · {log.target_table}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
