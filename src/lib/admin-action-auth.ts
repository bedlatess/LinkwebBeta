import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionFromRequest,
} from "@/lib/admin-session";
import { cookies } from "next/headers";

export async function requireAdminActionSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const request = new Request("http://linkweb.local/sys-admin/action", {
    headers: token ? { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } : {},
  });
  const session = await verifyAdminSessionFromRequest(request);

  if (!session) {
    throw new Error("Unauthorized admin action");
  }

  return session;
}
