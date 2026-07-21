import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { listChecklistTemplatesForAdmin } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";
import { BRAND_LABELS } from "@/types/domain";

export default async function AdminChecklistsPage() {
  const supabase = await createServerSupabaseClient();
  const [templates, { data: stores }] = await Promise.all([
    listChecklistTemplatesForAdmin(supabase),
    supabase.from("stores").select("id, name"),
  ]);
  const storeNameById = new Map((stores ?? []).map((s) => [s.id, s.name]));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">체크리스트 관리</h1>
        <Link href="/admin/checklists/new">
          <Button size="md">
            <Plus className="h-4 w-4" /> 템플릿 추가
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState title="등록된 체크리스트 템플릿이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/admin/checklists/${t.id}`}>
              <Card>
                <CardHeader>
                  <CardTitle>
                    {CHECKLIST_TYPE_LABEL[t.type]} · {t.name}
                  </CardTitle>
                  <StatusBadge label={t.active ? "확인완료" : "미확인"} tone={t.active ? "success" : "neutral"} />
                </CardHeader>
                <CardDescription>
                  {t.store_id ? storeNameById.get(t.store_id) : `공통 (${BRAND_LABELS[t.brand_type]})`}
                </CardDescription>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
