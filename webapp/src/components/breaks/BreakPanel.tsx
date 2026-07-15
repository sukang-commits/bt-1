"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PhotoAttachmentField } from "@/components/forms/PhotoAttachmentField";
import { useToast } from "@/components/providers/ToastProvider";
import { startBreak, endBreak } from "@/lib/breaks/actions";
import { BREAK_STATUS_LABEL, computeElapsedMinutes } from "@/lib/breaks/types";
import { breakPhotoRequirement, isPhotoRequiredNow } from "@/lib/grades/policy";
import { formatDateTimeKst } from "@/lib/date";
import type { BreakRow, EmployeeGradeEnum } from "@/types/database";

interface BreakPanelProps {
  storeId: string;
  userId: string;
  grade: EmployeeGradeEnum;
  activeBreak: BreakRow | null;
  todaysBreaks: BreakRow[];
}

export function BreakPanel({ storeId, userId, grade, activeBreak, todaysBreaks }: BreakPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [photoId, setPhotoId] = useState<string | null>(null);

  const requirement = breakPhotoRequirement(grade);
  const photoNeededNow = isPhotoRequiredNow(requirement, note.trim().length > 0);
  const showPhotoField = requirement !== "none";

  const elapsedMinutes = useMemo(() => {
    if (!activeBreak) return 0;
    return computeElapsedMinutes(activeBreak.started_at);
  }, [activeBreak]);

  const handleStart = async () => {
    setLoading(true);
    try {
      await startBreak(storeId);
      showToast("휴게를 시작했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("휴게 시작에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEnd = async () => {
    if (!activeBreak) return;
    if (photoNeededNow && !photoId) {
      showToast("사진 인증이 필요합니다", { variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      await endBreak(activeBreak.id, storeId, { note: note || null, photoAttachmentId: photoId });
      showToast("휴게를 종료했습니다", { variant: "success" });
      setNote("");
      setPhotoId(null);
      router.refresh();
    } catch (error) {
      showToast("휴게 종료에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5 text-brand-dark" /> 휴게 인증
          </CardTitle>
          {activeBreak ? <StatusBadge label="휴게중" /> : <StatusBadge label="미사용" tone="neutral" />}
        </CardHeader>

        {activeBreak ? (
          <div className="flex flex-col gap-3">
            <CardDescription>
              {formatDateTimeKst(activeBreak.started_at)}부터 진행 중 (경과 {elapsedMinutes}분)
            </CardDescription>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink">특이사항 (선택)</label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-border bg-page p-3 text-sm text-ink"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {showPhotoField && (
              <PhotoAttachmentField
                category="break"
                storeId={storeId}
                userId={userId}
                value={photoId}
                onChange={setPhotoId}
                required={photoNeededNow}
              />
            )}

            <Button size="lg" loading={loading} onClick={handleEnd}>
              휴게 종료
            </Button>
          </div>
        ) : (
          <Button size="lg" loading={loading} onClick={handleStart}>
            휴게 시작
          </Button>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>오늘의 휴게 내역</CardTitle>
        </CardHeader>
        {todaysBreaks.length === 0 ? (
          <CardDescription>오늘 사용한 휴게가 없습니다.</CardDescription>
        ) : (
          <ul className="flex flex-col gap-2">
            {todaysBreaks.map((b) => (
              <li key={b.id} className="flex items-center justify-between text-sm text-ink">
                <span>
                  {formatDateTimeKst(b.started_at)} ~ {b.ended_at ? formatDateTimeKst(b.ended_at) : "진행중"}
                </span>
                <span className="flex items-center gap-2">
                  {b.duration_minutes !== null && <span className="text-muted">{b.duration_minutes}분</span>}
                  <StatusBadge label={BREAK_STATUS_LABEL[b.status]} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
