"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/providers/ToastProvider";
import { resetAccountPassword, setAccountActive, updateAccountRole } from "@/lib/accounts/actions";
import { ROLE_LABELS } from "@/types/domain";
import type { UserRoleEnum } from "@/types/database";

const ROLE_OPTIONS: UserRoleEnum[] = [
  "worker",
  "store_manager",
  "senior_manager",
  "deputy_manager",
  "administrator",
];

export function AccountRow({
  profileId,
  username,
  name,
  role,
  active,
}: {
  profileId: string;
  username: string;
  name: string;
  role: UserRoleEnum;
  active: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleRoleChange = async (newRole: UserRoleEnum) => {
    setLoading(true);
    try {
      await updateAccountRole(profileId, newRole);
      showToast("권한을 변경했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("변경에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      await setAccountActive(profileId, !active);
      showToast(active ? "계정을 비활성화했습니다" : "계정을 활성화했습니다", { variant: "success" });
      router.refresh();
    } catch (error) {
      showToast("변경에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) {
      showToast("비밀번호는 8자 이상으로 입력해 주세요", { variant: "warning" });
      return;
    }
    setLoading(true);
    try {
      await resetAccountPassword(profileId, newPassword);
      showToast("비밀번호를 재설정했습니다", { variant: "success" });
      setNewPassword("");
      setResetting(false);
    } catch (error) {
      showToast("재설정에 실패했습니다", {
        description: error instanceof Error ? error.message : undefined,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium text-ink">
            {name} <span className="font-normal text-muted">({username})</span>
          </p>
          <p className="text-xs text-muted">{active ? "활성" : "비활성"}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="h-10 rounded-lg border border-border bg-page px-2 text-sm text-ink"
            value={role}
            disabled={loading}
            onChange={(e) => handleRoleChange(e.target.value as UserRoleEnum)}
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <Button variant="outline" size="md" disabled={loading} onClick={() => setResetting((v) => !v)}>
            비밀번호 재설정
          </Button>
          <Button variant={active ? "danger" : "outline"} size="md" loading={loading} onClick={handleToggleActive}>
            {active ? "비활성화" : "활성화"}
          </Button>
        </div>
      </div>

      {resetting && (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-2">
          <input
            type="text"
            placeholder="새 비밀번호 (8자 이상)"
            className="h-10 flex-1 rounded-lg border border-border bg-page px-2 text-sm text-ink"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button size="md" loading={loading} onClick={handleResetPassword}>
            저장
          </Button>
        </div>
      )}
    </div>
  );
}
