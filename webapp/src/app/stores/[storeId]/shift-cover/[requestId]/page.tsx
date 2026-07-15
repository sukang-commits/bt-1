import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ShiftCoverAcceptButton } from "@/components/shift-cover/ShiftCoverAcceptButton";
import {
  ApproveAcceptanceButton,
  CancelRequestButton,
  ChooseAcceptanceButton,
} from "@/components/shift-cover/ShiftCoverActionButtons";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth/session";
import {
  findOverlappingAcceptance,
  getShiftCoverRequestDetail,
  listAcceptancesForRequest,
} from "@/lib/shift-cover/queries";
import { ACCEPTANCE_STATUS_LABEL, SHIFT_COVER_STATUS_LABEL } from "@/lib/shift-cover/types";

export default async function ShiftCoverDetailPage({
  params,
}: {
  params: Promise<{ storeId: string; requestId: string }>;
}) {
  const { storeId, requestId } = await params;
  const user = await getSessionUser();
  const supabase = await createServerSupabaseClient();

  const request = await getShiftCoverRequestDetail(supabase, requestId);
  if (!request) notFound();

  const acceptances = await listAcceptancesForRequest(supabase, requestId);
  const profileIds = Array.from(new Set(acceptances.map((a) => a.accepted_by)));
  const { data: profiles } = profileIds.length
    ? await supabase.from("profiles").select("id, name").in("id", profileIds)
    : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.name]));

  const isRequester = user?.id === request.requested_by;
  const isAdmin = user && ["senior_manager", "deputy_manager", "administrator"].includes(user.role);
  const alreadyAccepted = user ? acceptances.some((a) => a.accepted_by === user.id) : false;
  const canAccept =
    user && !isRequester && !alreadyAccepted && ["recruiting", "pending_acceptance"].includes(request.status);

  const overlap = user && canAccept ? await findOverlappingAcceptance(supabase, user.id, request.work_date) : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href={`/stores/${storeId}/shift-cover`} className="text-sm text-muted">
        ← 대타 목록으로
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{request.work_date}</CardTitle>
          <div className="flex items-center gap-1.5">
            {request.is_urgent && <StatusBadge label="긴급" tone="danger" />}
            <StatusBadge label={SHIFT_COVER_STATUS_LABEL[request.status]} />
          </div>
        </CardHeader>
        <CardDescription>
          {request.start_time.slice(0, 5)} ~ {request.end_time.slice(0, 5)}
          {request.position && ` · ${request.position}`}
        </CardDescription>
        {request.reason && <p className="mt-2 text-sm text-ink">{request.reason}</p>}

        {isRequester && ["recruiting", "pending_acceptance"].includes(request.status) && (
          <div className="mt-4">
            <CancelRequestButton requestId={request.id} storeId={storeId} />
          </div>
        )}
      </Card>

      {canAccept && (
        <ShiftCoverAcceptButton requestId={request.id} storeId={storeId} hasOverlap={Boolean(overlap)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle>수락 신청 현황</CardTitle>
        </CardHeader>
        {acceptances.length === 0 ? (
          <CardDescription>아직 수락 신청이 없습니다.</CardDescription>
        ) : (
          <ul className="flex flex-col gap-3">
            {acceptances.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {nameById.get(a.accepted_by) ?? "-"} {a.is_cross_store && "(타 매장)"}
                  </p>
                  <StatusBadge label={ACCEPTANCE_STATUS_LABEL[a.status]} />
                </div>
                <div className="flex gap-2">
                  {isRequester && a.status === "pending" && !a.is_cross_store && (
                    <ChooseAcceptanceButton acceptanceId={a.id} requestId={request.id} storeId={storeId} />
                  )}
                  {isRequester && a.status === "pending" && a.is_cross_store && request.status !== "pending_admin_approval" && (
                    <ChooseAcceptanceButton acceptanceId={a.id} requestId={request.id} storeId={storeId} />
                  )}
                  {isAdmin && a.status === "pending" && a.is_cross_store && request.status === "pending_admin_approval" && (
                    <ApproveAcceptanceButton acceptanceId={a.id} requestId={request.id} storeId={storeId} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
