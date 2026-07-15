"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PhotoAttachmentField } from "@/components/forms/PhotoAttachmentField";
import { useToast } from "@/components/providers/ToastProvider";
import { saveSettlement } from "@/lib/settlements/actions";
import { WORK_SHIFT_LABEL } from "@/lib/settlements/types";
import type { BrandTypeEnum, SettlementRow, WorkShiftEnum } from "@/types/database";
import { todayKst } from "@/lib/date";

const schema = z.object({
  workDate: z.string().min(1),
  workShift: z.enum(["open", "middle", "close", "night"]),
  posAmount: z.number().min(0),
  cashAmount: z.number().min(0),
  cardConfirmed: z.boolean(),
  note: z.string().optional(),
  extraAmount: z.number().optional(),
});

type FormValues = z.infer<typeof schema>;

interface SettlementFormProps {
  storeId: string;
  userId: string;
  brandType: BrandTypeEnum;
  initialData?: SettlementRow;
}

export function SettlementForm({ storeId, userId, brandType, initialData }: SettlementFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState<"draft" | "submit" | null>(null);
  const [photoId, setPhotoId] = useState<string | null>(initialData?.photo_attachment_id ?? null);

  const {
    register,
    handleSubmit,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      workDate: initialData?.work_date ?? todayKst(),
      workShift: (initialData?.work_shift as WorkShiftEnum) ?? "open",
      posAmount: initialData?.pos_amount ?? 0,
      cashAmount: initialData?.cash_amount ?? 0,
      cardConfirmed: initialData?.card_confirmed ?? false,
      note: initialData?.note ?? "",
      extraAmount:
        (initialData?.extra_fields?.[brandType === "pc" ? "deliveryAppAmount" : "takeoutAmount"] as
          | number
          | undefined) ?? 0,
    },
  });

  const posAmount = Number(watch("posAmount") || 0);
  const cashAmount = Number(watch("cashAmount") || 0);
  const variance = useMemo(() => cashAmount - posAmount, [cashAmount, posAmount]);

  const submitForm = (submit: boolean) =>
    handleSubmit(async (values) => {
      if (variance !== 0 && (!values.note || values.note.trim().length === 0)) {
        showToast("차액이 있는 경우 특이사항을 입력해 주세요", { variant: "warning" });
        return;
      }

      setSubmitting(submit ? "submit" : "draft");
      try {
        const extraKey = brandType === "pc" ? "deliveryAppAmount" : "takeoutAmount";
        await saveSettlement(initialData?.id ?? null, {
          storeId,
          workDate: values.workDate,
          workShift: values.workShift,
          posAmount: values.posAmount,
          cashAmount: values.cashAmount,
          cardConfirmed: values.cardConfirmed,
          note: values.note || null,
          photoAttachmentId: photoId,
          extraFields: { [extraKey]: values.extraAmount ?? 0 },
          submit,
        });
        showToast(submit ? "정산을 제출했습니다" : "임시 저장했습니다", { variant: "success" });
        router.push(`/stores/${storeId}/settlements`);
        router.refresh();
      } catch (error) {
        showToast("저장에 실패했습니다", {
          description: error instanceof Error ? error.message : undefined,
          variant: "error",
        });
      } finally {
        setSubmitting(null);
      }
    })();

  return (
    <form className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">근무일</label>
          <input
            type="date"
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
            {...register("workDate")}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">근무 구분</label>
          <select
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
            {...register("workShift")}
          >
            {Object.entries(WORK_SHIFT_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">POS 정산금액</label>
          <input
            type="number"
            inputMode="numeric"
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
            {...register("posAmount", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">현금 시재금액</label>
          <input
            type="number"
            inputMode="numeric"
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
            {...register("cashAmount", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          {brandType === "pc" ? "배달앱 정산금액" : "포장 정산금액"}
        </label>
        <input
          type="number"
          inputMode="numeric"
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink"
          {...register("extraAmount", { valueAsNumber: true })}
        />
      </div>

      <div
        className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
          variance !== 0 ? "border-warning bg-warning-bg" : "border-border bg-subtle"
        }`}
      >
        <span className="text-sm font-medium text-ink">차액 (현금 - POS)</span>
        <span className={`text-base font-bold ${variance !== 0 ? "text-warning" : "text-ink"}`}>
          {variance.toLocaleString()}원
        </span>
      </div>
      {variance !== 0 && (
        <p className="-mt-2 flex items-center gap-1.5 text-xs text-warning">
          <AlertTriangle className="h-3.5 w-3.5" /> 차액이 있습니다. 특이사항을 반드시 입력해 주세요.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" {...register("cardConfirmed")} /> 카드 정산 확인 완료
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">
          특이사항{variance !== 0 && <span className="ml-0.5 text-danger">*</span>}
        </label>
        <textarea
          rows={3}
          className="w-full rounded-xl border border-border bg-surface p-3 text-ink"
          {...register("note")}
        />
      </div>

      <PhotoAttachmentField
        category="settlement"
        storeId={storeId}
        userId={userId}
        value={photoId}
        onChange={setPhotoId}
      />

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          loading={submitting === "draft"}
          onClick={() => submitForm(false)}
        >
          임시 저장
        </Button>
        <Button
          type="button"
          size="lg"
          className="flex-1"
          loading={submitting === "submit"}
          onClick={() => submitForm(true)}
        >
          제출하기
        </Button>
      </div>
    </form>
  );
}
