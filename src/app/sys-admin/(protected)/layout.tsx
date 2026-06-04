import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionFromRequest,
} from "@/lib/admin-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "../admin-shell";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const request = new Request("http://linkweb.local/sys-admin", {
    headers: token ? { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } : {},
  });
  const adminSession = await verifyAdminSessionFromRequest(request);

  if (!adminSession) {
    redirect("/sys-admin/login");
  }

  return (
    <AdminShell adminEmail={adminSession.email}>{children}</AdminShell>
  );
}
