import Link from "next/link";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ROLE_LABELS } from "@/types/domain";
import type { UserRoleEnum } from "@/types/database";

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
  return (
    <Link href={`/admin/accounts/${profileId}`}>
      <Card>
        <CardHeader>
          <CardTitle>
            {name} <span className="font-normal text-muted">({username})</span>
          </CardTitle>
          <StatusBadge label={active ? "활성" : "비활성"} tone={active ? "success" : "neutral"} />
        </CardHeader>
        <CardDescription>{ROLE_LABELS[role]}</CardDescription>
      </Card>
    </Link>
  );
}
