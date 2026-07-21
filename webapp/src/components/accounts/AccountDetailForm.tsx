"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/providers/ToastProvider";
import {
  deleteAccount,
  resetAccountPassword,
  setAccountActive,
  updateAccountDetails,
  updateAccountRole,
} from "@/lib/accounts/actions";
import { BRAND_LABELS, ROLE_LABELS } from "@/types/domain";
import type { BrandTypeEnum, UserRoleEnum } from "@/types/database";

const ROLE_OPTIONS: UserRoleEnum[] = [
  "worker",
  "store_manager",
  "senior_manager",
  "deputy_manager",
  "administrator",
];

export function AccountDetailForm({
  profileId,
  username,
  initialName,
  initialRole,
  initialBrandType,
  initialActive,
  initialStoreId,
  stores,
}: {
  profileId: string;
  username: string;
  initialName: string;
  initialRole: UserRoleEnum;
  initialBrandType: BrandTypeEnum;
  initialActive: boolean;
  initialStoreId: string | null;
  stores: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [brandType, setBrandType] = useState(initialBrandType);
  const [storeId, setStoreId] = useState(initialStoreId ?? "");
  const [active, setActive] = useState(initialActive);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAccountDetails(profileId, { name, brandType, storeId: storeId || null });
      if (role !== initialRole) await updateAccountRole(profileId, role);
      if (active !== initialActive) await setAccountActive(profileId, active);
      showToast("계정 정보를 저장했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("저장에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 4) {
      showToast("비밀번호는 4자 이상으로 입력해 주세요", { variant: "warning" });
      return;
    }
    setResetting(true);
    try {
      await resetAccountPassword(profileId, newPassword);
      showToast("비밀번호를 재설정했습니다", { variant: "success" });
      setNewPassword("");
    } catch (error) {
      showToast("재설정에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount(profileId);
      showToast("계정을 삭제했습니다", { variant: "success" });
      router.push("/admin/accounts");
    } catch (error) {
      showToast("삭제에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <p className="font-semibold text-ink">기본 정보 (아이디: {username})</p>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink">이름</label>
          <input
            className="h-11 w-full rounded-xl border border-border bg-page px-3 text-sm text-ink"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
          <label className="mb-1.5 block text-sm font-medium text-ink">소속 매장</label>
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

        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" className="h-5 w-5" checked={active} onChange={(e) => setActive(e.target.checked)} />
          활성 (해제하면 로그인 불가)
        </label>

        <Button size="md" loading={saving} onClick={handleSave}>
          저장
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
        <p className="font-semibold text-ink">비밀번호 재설정</p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="새 비밀번호 (4자 이상)"
            className="h-11 flex-1 rounded-xl border border-border bg-page px-3 text-sm text-ink"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button size="md" loading={resetting} onClick={handleResetPassword}>
            재설정
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-danger bg-surface p-4">
        <p className="font-semibold text-danger">계정 삭제</p>
        <p className="text-sm text-muted">
          정산/체크리스트/공지 등 이 계정이 남긴 기록이 있으면 삭제할 수 없습니다 (참조 무결성 보호).
          퇴사자는 삭제 대신 위에서 &quot;활성&quot; 체크를 해제해 주세요.
        </p>
        <Button variant="danger" size="md" onClick={() => setConfirmDelete(true)}>
          계정 완전 삭제
        </Button>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title="계정을 완전히 삭제할까요?"
        description="되돌릴 수 없습니다. 활동 기록이 있는 계정은 삭제 대신 비활성화를 권장합니다."
        confirmLabel="삭제"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}
