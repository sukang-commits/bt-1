"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const schema = z
  .object({
    password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
    passwordConfirm: z.string().min(1, "비밀번호를 한 번 더 입력해 주세요."),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

type FormValues = z.infer<typeof schema>;

// Supabase가 보낸 재설정 링크로 접속하면 브라우저 클라이언트가 URL의 토큰으로
// 임시 세션(recovery session)을 자동으로 만들어 줍니다. 이 화면에서는 그 세션으로
// 새 비밀번호만 설정하면 됩니다.
export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ password }) => {
    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      showToast("비밀번호 변경에 실패했습니다", { description: error.message, variant: "error" });
      return;
    }

    showToast("비밀번호가 변경되었습니다", { variant: "success" });
    router.replace("/login");
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-page px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl shadow-sm">
            🐝
          </span>
          <h1 className="text-xl font-bold text-ink">새 비밀번호 설정</h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password">
              새 비밀번호
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="8자 이상 입력하세요"
                className="h-14 w-full rounded-xl border border-border bg-page pl-11 pr-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="passwordConfirm">
              새 비밀번호 확인
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="다시 한 번 입력하세요"
                className="h-14 w-full rounded-xl border border-border bg-page pl-11 pr-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
                {...register("passwordConfirm")}
              />
            </div>
            {errors.passwordConfirm && (
              <p className="mt-1 text-xs text-danger">{errors.passwordConfirm.message}</p>
            )}
          </div>

          <Button type="submit" size="lg" loading={submitting} className="w-full">
            비밀번호 변경
          </Button>
        </form>
      </div>
    </div>
  );
}
