"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const PERMISSION_FIELDS = [
  "allowCustomCSS",
  "allowCustomFont",
  "allowTips",
] as const;

type PermissionField = (typeof PERMISSION_FIELDS)[number];

export async function toggleUserBan(userId: string) {
  await requireAdminActionSession();

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

  revalidatePath("/admin/users");
}

export async function toggleUserPermission(
  userId: string,
  field: PermissionField
) {
  await requireAdminActionSession();

  if (!PERMISSION_FIELDS.includes(field)) {
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

  const currentValue = user[field];

  await prisma.user.update({
    where: { id: userId },
    data: { [field]: !currentValue },
  });

  revalidatePath("/admin/users");
}
