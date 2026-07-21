"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { createAccount } from "@/lib/accounts/actions";
import { ROLE_LABELS, BRAND_LABELS } from "@/types/domain";
import type { BrandTypeEnum, UserRoleEnum } from "@/types/database";

const ROLE_OPTIONS: UserRoleEnum[] = [
  "worker",
  "store_manager",
  "senior_manager",
  "deputy_manager",
  "administrator",
];

export function CreateAccountForm({ stores }: { stores: { id: string; name: string }[] }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRoleEnum>("worker");
  const [brandType, setBrandType] = useState<BrandTypeEnum>("pc");
  const [storeId, setStoreId] = useState("");

  const reset = () => {
    setUsername("");
    setPassword("");
    setName("");
    setRole("worker");
    setBrandType("pc");
    setStoreId("");
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await createAccount({
        username,
        password,
        name,
        role,
        brandType,
        storeId: storeId || null,
      });
      showToast("계정을 생성했습니다", { variant: "success" });
      reset();
      setOpen(false);
      router.refresh();
    } catch (error) {
      showToast("계정 생성에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <Button size="md" onClick={() => setOpen(true)}>
        + 신규 계정 발급
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
      <p className="font-semibold text-ink">신규 계정 발급</p>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">이름</label>
        <input
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">아이디</label>
        <input
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
          placeholder="영문 소문자/숫자 3~20자"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">초기 비밀번호</label>
        <input
          type="text"
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
          placeholder="4자 이상"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">역할</label>
        <select
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRoleEnum)}
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">브랜드</label>
        <select
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
          value={brandType}
          onChange={(e) => setBrandType(e.target.value as BrandTypeEnum)}
        >
          {Object.entries(BRAND_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink">소속 매장 (관리자는 선택 안 해도 됨)</label>
        <select
          className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="">선택 안 함</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-2">
        <Button size="md" loading={submitting} onClick={handleSubmit}>
          생성
        </Button>
        <Button size="md" variant="outline" onClick={() => setOpen(false)}>
          취소
        </Button>
      </div>
    </div>
  );
}
