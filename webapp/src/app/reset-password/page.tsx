"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().min(1, "이메일을 입력해 주세요.").email("이메일 형식이 올바르지 않습니다."),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitting(true);
    const supabase = createBrowserSupabaseClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password/confirm`,
    });

    setSubmitting(false);

    if (error) {
      showToast("요청을 처리하지 못했습니다", { description: error.message, variant: "error" });
      return;
    }

    setSent(true);
    showToast("재설정 메일을 보냈습니다", {
      description: "메일함에서 링크를 확인해 주세요.",
      variant: "success",
    });
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-page px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl shadow-sm">
            🐝
          </span>
          <h1 className="text-xl font-bold text-ink">비밀번호 재설정</h1>
          <p className="text-center text-sm text-muted">
            가입된 이메일로 비밀번호 재설정 링크를 보내드립니다.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-surface p-5 text-center text-sm text-ink shadow-sm">
            메일을 확인해 링크를 눌러 새 비밀번호를 설정해 주세요.
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="email">
                이메일
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="가입된 이메일을 입력하세요"
                  className="h-14 w-full rounded-xl border border-border bg-page pl-11 pr-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
                  {...register("email")}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              재설정 메일 보내기
            </Button>
          </form>
        )}

        <Link href="/login" className="mt-4 block text-center text-sm font-medium text-brand-dark">
          로그인 화면으로 돌아가기
        </Link>
      </div>
    </div>
  );
}
