import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import { listChecklistsForStoreManagement } from "@/lib/checklists/queries";
import { CHECKLIST_TYPE_LABEL } from "@/lib/checklists/types";

// 매장 관리자가 자기 매장의 체크리스트(업무) 템플릿을 추가/관리하는 화면.
// 상위 관리자(선임/대리/전체)는 모든 매장에서 접근 가능합니다.
export default async function StoreChecklistManagePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const canManage =
    ["senior_manager", "deputy_manager", "administrator"].includes(user.role) ||
    (user.role === "store_manager" && user.storeId === storeId);
  if (!canManage) redirect(`/stores/${storeId}/checklist`);

  const supabase = await createServerSupabaseClient();
  const { data: store } = await supabase.from("stores").select("brand_type").eq("id", storeId).maybeSingle();
  if (!store) redirect(`/stores/${storeId}/checklist`);

  const templates = await listChecklistsForStoreManagement(supabase, storeId, store.brand_type);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/checklist`} className="text-sm text-muted">
        ← 체크리스트로
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">매장 업무 관리</h1>
        <Link href={`/stores/${storeId}/checklist/manage/new`}>
          <Button size="md">
            <Plus className="h-4 w-4" /> 템플릿 추가
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState title="등록된 체크리스트 템플릿이 없습니다" />
      ) : (
        <div className="flex flex-col gap-3">
          {templates.map((t) => {
            const editable = t.store_id === storeId;
            const card = (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {CHECKLIST_TYPE_LABEL[t.type]} · {t.name}
                  </CardTitle>
                  <StatusBadge label={t.active ? "사용중" : "미사용"} tone={t.active ? "success" : "neutral"} />
                </CardHeader>
                <CardDescription>{editable ? "매장 전용 (수정 가능)" : "브랜드 공통 (상위 관리자 전용)"}</CardDescription>
              </Card>
            );
            return editable ? (
              <Link key={t.id} href={`/stores/${storeId}/checklist/manage/${t.id}`}>
                {card}
              </Link>
            ) : (
              <div key={t.id}>{card}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
