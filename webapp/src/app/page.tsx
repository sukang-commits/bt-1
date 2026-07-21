import { redirect } from "next/navigation";
import { getSessionUser, homeHrefForRole } from "@/lib/auth/session";

export default async function RootPage() {
  const user = await getSessionUser();

  if (user) {
    redirect(homeHrefForRole(user));
  }

  redirect("/login");
}
