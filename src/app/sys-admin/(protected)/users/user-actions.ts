"use server";

import {
  requireAdminActionSession,
  requireSuperAdminActionSession,
  type AdminPermissionField,
} from "@/lib/admin-action-auth";
import { validateRegistrationPassword } from "@/lib/password-policy";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function withToast(path: string, message: string) {
  return `${path}?toast=${encodeURIComponent(message)}`;
}

const USER_PERMISSION_FIELDS = [
  "allowCustomCSS",
  "allowCustomFont",
  "allowTips",
] as const;

const RESERVED_USERNAMES = new Set([
  "dashboard",
  "auth",
  "api",
  "sys-admin",
  "sysadmin",
  "root",
  "system",
  "login",
  "linkweb",
  "settings",
  "_next",
]);
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

const ADMIN_PERMISSION_FIELDS = [
  "permManageUsers",
  "permDeleteUsers",
  "permManageLinks",
  "permManageSettings",
  "permToggleMaintenance",
  "permViewUsers",
  "permBanUsers",
  "permEditUsers",
  "permResetUserPasswords",
  "permManageUserEntitlements",
  "permViewLinks",
  "permDeleteLinks",
  "permManageSiteSettings",
  "permManageAuthSettings",
  "permRunMaintenance",
] as const satisfies readonly AdminPermissionField[];

type UserPermissionField = (typeof USER_PERMISSION_FIELDS)[number];
export type AdminPermissionInput = Record<AdminPermissionField, boolean>;

export async function toggleUserBan(userId: string) {
  await requireAdminActionSession("permBanUsers");

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
  redirect(withToast("/sys-admin/users", nextBanned ? "封禁用户成功" : "解封用户成功"));
}

export async function createManagedUser(formData: FormData) {
  await requireSuperAdminActionSession();

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const username = String(formData.get("username") ?? "").toLowerCase().trim();
  const name = String(formData.get("name") ?? "").trim() || username;
  const password = String(formData.get("password") ?? "");

  if (!email || !email.includes("@")) {
    throw new Error("请填写有效邮箱。");
  }

  if (!USERNAME_REGEX.test(username)) {
    throw new Error("用户名只允许英文字母、数字和下划线，长度 3-30 个字符。");
  }

  if (RESERVED_USERNAMES.has(username)) {
    throw new Error("该用户名已被系统保留，无法创建。");
  }

  const passwordError = validateRegistrationPassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        username,
        name,
        passwordHash,
      },
      select: { id: true },
    });

    await tx.themeConfig.create({
      data: {
        userId: user.id,
        bgType: "gradient",
        bgValue: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
        bgBlur: 10,
        buttonStyle: "rounded",
      },
      select: { id: true },
    });
  });

  revalidatePath("/sys-admin/users");
  redirect(withToast("/sys-admin/users", "新增用户成功"));
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
  redirect(withToast("/sys-admin/users", "删除用户成功"));
}

export async function toggleUserPermission(
  userId: string,
  field: UserPermissionField
) {
  await requireAdminActionSession("permManageUserEntitlements");

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
  redirect(withToast("/sys-admin/users", "用户高级能力已更新"));
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
          permViewUsers: true,
          permBanUsers: false,
          permEditUsers: false,
          permResetUserPasswords: false,
          permManageUserEntitlements: false,
          permViewLinks: false,
          permDeleteLinks: false,
          permManageSiteSettings: false,
          permManageAuthSettings: false,
          permRunMaintenance: false,
        }
      : {
          role: "USER",
          permManageUsers: false,
          permDeleteUsers: false,
          permManageLinks: false,
          permManageSettings: false,
          permToggleMaintenance: false,
          permViewUsers: false,
          permBanUsers: false,
          permEditUsers: false,
          permResetUserPasswords: false,
          permManageUserEntitlements: false,
          permViewLinks: false,
          permDeleteLinks: false,
          permManageSiteSettings: false,
          permManageAuthSettings: false,
          permRunMaintenance: false,
        },
  });

  revalidatePath("/sys-admin/users");
  redirect(withToast("/sys-admin/users", promoting ? "已设为管理员" : "已撤销管理员"));
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
      permViewUsers: true,
      permBanUsers: true,
      permEditUsers: true,
      permResetUserPasswords: true,
      permManageUserEntitlements: true,
      permDeleteUsers: true,
      permViewLinks: true,
      permDeleteLinks: true,
      permManageSiteSettings: true,
      permManageAuthSettings: true,
      permRunMaintenance: true,
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

  const legacyManageUsers =
    permissions.permViewUsers ||
    permissions.permBanUsers ||
    permissions.permEditUsers ||
    permissions.permResetUserPasswords ||
    permissions.permManageUserEntitlements ||
    permissions.permRunMaintenance;
  const legacyManageLinks =
    permissions.permViewLinks || permissions.permDeleteLinks;
  const legacyManageSettings =
    permissions.permManageSiteSettings || permissions.permManageAuthSettings;

  if (highRiskChanged && !highRiskConfirmed) {
    throw new Error("High risk permission change requires confirmation");
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: {
      permViewUsers: permissions.permViewUsers,
      permBanUsers: permissions.permBanUsers,
      permEditUsers: permissions.permEditUsers,
      permResetUserPasswords: permissions.permResetUserPasswords,
      permManageUserEntitlements: permissions.permManageUserEntitlements,
      permDeleteUsers: permissions.permDeleteUsers,
      permViewLinks: permissions.permViewLinks,
      permDeleteLinks: permissions.permDeleteLinks,
      permManageSiteSettings: permissions.permManageSiteSettings,
      permManageAuthSettings: permissions.permManageAuthSettings,
      permRunMaintenance: permissions.permRunMaintenance,
      permToggleMaintenance: permissions.permToggleMaintenance,
      permManageUsers: legacyManageUsers,
      permManageLinks: legacyManageLinks,
      permManageSettings: legacyManageSettings,
    },
  });

  revalidatePath("/sys-admin/users");
  redirect(withToast("/sys-admin/users", "管理员权限保存成功"));
}
