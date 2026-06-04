import { auth, type AdminPermissionField } from "@/lib/auth";
import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionFromRequest,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export { ADMIN_PERMISSION_FIELDS } from "@/lib/auth";
export type { AdminPermissionField } from "@/lib/auth";

export type AdminPermissions = Record<AdminPermissionField, boolean>;

export type AdminActor =
  | {
      type: "SUPER_ADMIN";
      adminId: string;
      email: string;
      permissions: AdminPermissions;
    }
  | {
      type: "NORMAL_ADMIN";
      userId: string;
      email?: string | null;
      permissions: AdminPermissions;
    };

export const ALL_ADMIN_PERMISSIONS: AdminPermissions = {
  permManageUsers: true,
  permDeleteUsers: true,
  permManageLinks: true,
  permManageSettings: true,
  permToggleMaintenance: true,
};

function mapSessionPermissions(sessionUser: {
  permManageUsers?: boolean;
  permDeleteUsers?: boolean;
  permManageLinks?: boolean;
  permManageSettings?: boolean;
  permToggleMaintenance?: boolean;
}): AdminPermissions {
  return {
    permManageUsers: sessionUser.permManageUsers === true,
    permDeleteUsers: sessionUser.permDeleteUsers === true,
    permManageLinks: sessionUser.permManageLinks === true,
    permManageSettings: sessionUser.permManageSettings === true,
    permToggleMaintenance: sessionUser.permToggleMaintenance === true,
  };
}

export async function getAdminActor(): Promise<AdminActor | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const request = new Request("http://linkweb.local/sys-admin/action", {
    headers: token ? { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } : {},
  });
  const adminSession = await verifyAdminSessionFromRequest(request);

  if (adminSession) {
    return {
      type: "SUPER_ADMIN",
      adminId: adminSession.adminId,
      email: adminSession.email,
      permissions: ALL_ADMIN_PERMISSIONS,
    };
  }

  const session = await auth();

  if (session?.user?.id && session.user.role === "ADMIN") {
    return {
      type: "NORMAL_ADMIN",
      userId: session.user.id,
      email: session.user.email,
      permissions: mapSessionPermissions(session.user),
    };
  }

  return null;
}

export async function requireAdminActionSession(
  requiredPerm?: AdminPermissionField
) {
  const actor = await getAdminActor();

  if (!actor) {
    throw new Error("Unauthorized admin action");
  }

  if (actor.type === "SUPER_ADMIN") {
    return actor;
  }

  const freshUser = await prisma.user.findUnique({
    where: { id: actor.userId },
    select: {
      role: true,
      isBanned: true,
      permManageUsers: true,
      permDeleteUsers: true,
      permManageLinks: true,
      permManageSettings: true,
      permToggleMaintenance: true,
    },
  });

  if (!freshUser || freshUser.isBanned || freshUser.role !== "ADMIN") {
    throw new Error("Forbidden: Admin permission revoked");
  }

  const freshPermissions = mapSessionPermissions(freshUser);

  if (requiredPerm && freshPermissions[requiredPerm] !== true) {
    throw new Error("Forbidden: Insufficient permissions");
  }

  return {
    ...actor,
    permissions: freshPermissions,
  };
}

export async function requireSuperAdminActionSession() {
  const actor = await getAdminActor();

  if (actor?.type !== "SUPER_ADMIN") {
    throw new Error("Forbidden: Super admin required");
  }

  return actor;
}
