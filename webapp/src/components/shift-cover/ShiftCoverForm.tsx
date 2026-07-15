"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createShiftCoverRequest } from "@/lib/shift-cover/actions";
import { todayKst } from "@/lib/date";

const schema = z
  .object({
    workDate: z.string().min(1),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    position: z.string().optional(),
    reason: z.string().optional(),
    isUrgent: z.boolean(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "종료 시간은 시작 시간보다 늦어야 합니다.",
    path: ["endTime"],
  });

type FormValues = z.infer<typeof schema>;

export function ShiftCoverForm({ storeId }: { storeId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { workDate: todayKst(), startTime: "09:00", endTime: "13:00", isUrgent: false },
  });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await createShiftCoverRequest({
        storeId,
        workDate: values.workDate,
        startTime: values.startTime,
        endTime: values.endTime,
        position: values.position || null,
        reason: values.reason || null,
        isUrgent: values.isUrgent,
      });
      showToast("대타 요청을 등록했습니다", { variant: "success" });
      router.push(`/stores/${storeId}/shift-cover`);
      router.refresh();
    } catch (error) {
      showToast("등록에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">근무 날짜</label>
        <input type="date" className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink" {...register("workDate")} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">시작 시간</label>
          <input type="time" className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink" {...register("startTime")} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">종료 시간</label>
          <input type="time" className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink" {...register("endTime")} />
          {errors.endTime && <p className="mt-1 text-xs text-danger">{errors.endTime.message}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">근무 포지션 (선택)</label>
        <input className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-ink" {...register("position")} />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">요청 사유 (선택)</label>
        <textarea rows={3} className="w-full rounded-xl border border-border bg-surface p-3 text-ink" {...register("reason")} />
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" {...register("isUrgent")} /> 긴급 대타
      </label>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        대타 요청 등록
      </Button>
    </form>
  );
}
