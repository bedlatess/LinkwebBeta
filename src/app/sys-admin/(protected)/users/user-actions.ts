"use server";

import {
  requireAdminActionSession,
  requireSuperAdminActionSession,
  type AdminPermissionField,
} from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const USER_PERMISSION_FIELDS = [
  "allowCustomCSS",
  "allowCustomFont",
  "allowTips",
] as const;

const ADMIN_PERMISSION_FIELDS = [
  "permManageUsers",
  "permDeleteUsers",
  "permManageLinks",
  "permManageSettings",
  "permToggleMaintenance",
] as const satisfies readonly AdminPermissionField[];

type UserPermissionField = (typeof USER_PERMISSION_FIELDS)[number];
export type AdminPermissionInput = Record<AdminPermissionField, boolean>;

export async function toggleUserBan(userId: string) {
  await requireAdminActionSession("permManageUsers");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const nextBanned = !user.isBanned;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isBanned: nextBanned,
      bannedAt: nextBanned ? new Date() : null,
      bannedReason: nextBanned ? "管理员后台手动封禁" : null,
    },
  });

  revalidatePath("/sys-admin/users");
}

export async function deleteUser(userId: string) {
  await requireAdminActionSession("permDeleteUsers");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/sys-admin/users");
}

export async function toggleUserPermission(
  userId: string,
  field: UserPermissionField
) {
  await requireAdminActionSession("permManageUsers");

  if (!USER_PERMISSION_FIELDS.includes(field)) {
    throw new Error("Invalid permission field");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      allowCustomCSS: true,
      allowCustomFont: true,
      allowTips: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { [field]: !user[field] },
  });

  revalidatePath("/sys-admin/users");
}

export async function toggleAdminRole(targetUserId: string) {
  await requireSuperAdminActionSession();

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, role: true },
  });

  if (!target) {
    throw new Error("User not found");
  }

  const promoting = target.role !== "ADMIN";

  await prisma.user.update({
    where: { id: targetUserId },
    data: promoting
      ? {
          role: "ADMIN",
          permManageUsers: false,
          permDeleteUsers: false,
          permManageLinks: false,
          permManageSettings: false,
          permToggleMaintenance: false,
        }
      : {
          role: "USER",
          permManageUsers: false,
          permDeleteUsers: false,
          permManageLinks: false,
          permManageSettings: false,
          permToggleMaintenance: false,
        },
  });

  revalidatePath("/sys-admin/users");
}

export async function updateAdminPermissions(
  targetUserId: string,
  permissions: AdminPermissionInput,
  highRiskConfirmed = false
) {
  await requireSuperAdminActionSession();

  for (const field of ADMIN_PERMISSION_FIELDS) {
    if (typeof permissions[field] !== "boolean") {
      throw new Error(`Invalid permission value: ${field}`);
    }
  }

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: {
      id: true,
      role: true,
      permDeleteUsers: true,
      permToggleMaintenance: true,
    },
  });

  if (!target) {
    throw new Error("User not found");
  }

  if (target.role !== "ADMIN") {
    throw new Error("Target user is not an admin");
  }

  const highRiskChanged =
    target.permDeleteUsers !== permissions.permDeleteUsers ||
    target.permToggleMaintenance !== permissions.permToggleMaintenance;

  if (highRiskChanged && !highRiskConfirmed) {
    throw new Error("High risk permission change requires confirmation");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      permManageUsers: permissions.permManageUsers,
      permDeleteUsers: permissions.permDeleteUsers,
      permManageLinks: permissions.permManageLinks,
      permManageSettings: permissions.permManageSettings,
      permToggleMaintenance: permissions.permToggleMaintenance,
    },
  });

  revalidatePath("/sys-admin/users");
}
