import { getAdminActor } from "@/lib/admin-action-auth";
import { redirect } from "next/navigation";
import { AdminShell } from "../admin-shell";
import { AdminSessionProvider } from "../admin-session-provider";
import { AdminSessionRefresher } from "../admin-session-refresher";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getAdminActor();

  if (!actor) {
    redirect("/sys-admin/login");
  }

  const adminEmail =
    actor.type === "SUPER_ADMIN" ? actor.email : actor.email ?? actor.userId;

  const shell = (
    <AdminShell actor={actor} adminEmail={adminEmail}>
      {children}
    </AdminShell>
  );

  if (actor.type === "NORMAL_ADMIN") {
    return (
      <AdminSessionProvider>
        <AdminSessionRefresher />
        {shell}
      </AdminSessionProvider>
    );
  }

  return shell;
}
