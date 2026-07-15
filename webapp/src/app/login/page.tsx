"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Lock, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { MOCK_ADMIN_SESSION, MOCK_WORKER_SESSION } from "@/lib/mock/dev-data";

const loginSchema = z.object({
  username: z.string().min(1, "아이디를 입력해 주세요."),
  password: z.string().min(1, "비밀번호를 입력해 주세요."),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitting(true);
    // TODO(3단계): Supabase Authentication 연동으로 교체
    await new Promise((resolve) => setTimeout(resolve, 400));

    const isAdmin = values.username.toLowerCase().includes("admin");
    showToast(`${isAdmin ? MOCK_ADMIN_SESSION.name : MOCK_WORKER_SESSION.name}님 환영합니다`, {
      variant: "success",
    });

    if (isAdmin) {
      router.push("/admin");
    } else {
      router.push(`/stores/${MOCK_WORKER_SESSION.storeId}`);
    }
  });

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-page px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-3xl shadow-sm">
            🐝
          </span>
          <h1 className="text-2xl font-bold text-ink">워키도키</h1>
          <p className="text-sm text-muted">매장 근무·업무 인증 통합 관리 시스템</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="username">
              아이디
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="아이디를 입력하세요"
                className="h-14 w-full rounded-xl border border-border bg-page pl-11 pr-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
                {...register("username")}
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-xs text-danger">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink" htmlFor="password">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="비밀번호를 입력하세요"
                className="h-14 w-full rounded-xl border border-border bg-page pl-11 pr-3 text-base text-ink outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand/40"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" size="lg" loading={submitting} className="mt-2 w-full">
            로그인
          </Button>

          <p className="text-center text-xs text-muted">
            로그인 상태는 로그아웃하기 전까지 유지됩니다. 계정은 관리자가 발급합니다.
          </p>
        </form>
      </div>
    </div>
  );
}
