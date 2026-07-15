"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createNotice, updateNotice, type NoticeFormInput } from "@/lib/notices/actions";
import type { NoticeRow } from "@/types/database";

const schema = z.object({
  title: z.string().min(1, "제목을 입력해 주세요."),
  content: z.string().min(1, "내용을 입력해 주세요."),
  scope: z.enum(["store", "multi_store", "all_stores"]),
  storeId: z.string().nullable(),
  storeIds: z.array(z.string()),
  isImportant: z.boolean(),
  requiresAck: z.boolean(),
  ackDueAt: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

interface NoticeFormProps {
  lockedStoreId?: string; // store_manager 컨텍스트: scope=store로 고정
  allStores?: { id: string; name: string }[]; // 관리자 컨텍스트에서만 필요
  initialData?: NoticeRow;
  listHref: string;
}

export function NoticeForm({ lockedStoreId, allStores = [], initialData, listHref }: NoticeFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? "",
      content: initialData?.content ?? "",
      scope: lockedStoreId ? "store" : (initialData?.scope ?? "store"),
      storeId: lockedStoreId ?? initialData?.store_id ?? null,
      storeIds: [],
      isImportant: initialData?.is_important ?? false,
      requiresAck: initialData?.requires_ack ?? false,
      ackDueAt: initialData?.ack_due_at ? initialData.ack_due_at.slice(0, 16) : null,
    },
  });

  const scope = watch("scope");

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    const input: NoticeFormInput = {
      title: values.title,
      content: values.content,
      scope: values.scope,
      storeId: values.scope === "store" ? values.storeId : null,
      storeIds: values.scope === "multi_store" ? values.storeIds : [],
      isImportant: values.isImportant,
      requiresAck: values.requiresAck,
      ackDueAt: values.ackDueAt ? new Date(values.ackDueAt).toISOString() : null,
      attachmentIds: [],
    };

    try {
      if (initialData) {
        await updateNotice(initialData.id, input);
        showToast("공지를 수정했습니다", { variant: "success" });
      } else {
        await createNotice(input);
        showToast("공지를 등록했습니다", { variant: "success" });
      }
      router.push(listHref);
      router.refresh();
    } catch (error) {
      showToast("저장에 실패했습니다", {
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
        <label className="mb-1.5 block text-sm font-medium text-ink">제목</label>
        <input
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
          {...register("title")}
        />
        {errors.title && <p className="mt-1 text-xs text-danger">{errors.title.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">내용</label>
        <textarea
          rows={6}
          className="w-full rounded-xl border border-border bg-surface p-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
          {...register("content")}
        />
        {errors.content && <p className="mt-1 text-xs text-danger">{errors.content.message}</p>}
      </div>

      {!lockedStoreId && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">공지 범위</label>
          <select
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink"
            {...register("scope")}
          >
            <option value="store">특정 매장</option>
            <option value="multi_store">여러 매장</option>
            <option value="all_stores">전체 매장</option>
          </select>
        </div>
      )}

      {!lockedStoreId && scope === "store" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">대상 매장</label>
          <select
            className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink"
            {...register("storeId")}
          >
            <option value="">매장 선택</option>
            {allStores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {!lockedStoreId && scope === "multi_store" && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">대상 매장 (복수 선택)</label>
          <Controller
            control={control}
            name="storeIds"
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 rounded-xl border border-border p-3 sm:grid-cols-4">
                {allStores.map((s) => {
                  const checked = field.value.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-2 text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          field.onChange(
                            e.target.checked
                              ? [...field.value, s.id]
                              : field.value.filter((id) => id !== s.id)
                          );
                        }}
                      />
                      {s.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">확인 마감일 (선택)</label>
        <input
          type="datetime-local"
          className="h-12 w-full rounded-xl border border-border bg-surface px-3 text-base text-ink"
          {...register("ackDueAt")}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" {...register("isImportant")} /> 중요 공지로 표시
        </label>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" {...register("requiresAck")} /> 필수 확인 공지
        </label>
      </div>

      <Button type="submit" size="lg" loading={submitting} className="w-full">
        {initialData ? "수정 완료" : "공지 등록"}
      </Button>
    </form>
  );
}
