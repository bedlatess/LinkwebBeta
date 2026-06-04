"use server";

import {
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export async function changeSuperAdminPassword(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const { verifyAdminSessionFromRequest } = await import("@/lib/admin-session");
  const request = new Request("http://linkweb.local/sys-admin/password", {
    headers: { cookie: `${ADMIN_SESSION_COOKIE}=${token}` },
  });
  const session = await verifyAdminSessionFromRequest(request);

  if (!session) {
    throw new Error("Unauthorized");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    throw new Error("请完整填写密码信息。");
  }

  if (newPassword.length < 12) {
    throw new Error("新密码至少需要 12 个字符。");
  }

  if (newPassword !== confirmPassword) {
    throw new Error("两次输入的新密码不一致。");
  }

  const admin = await prisma.adminUser.findUnique({
    where: { id: session.adminId },
    select: {
      id: true,
      passwordHash: true,
      isActive: true,
      tokenVersion: true,
    },
  });

  if (!admin?.isActive) {
    throw new Error("当前超级管理员不可用。");
  }

  const passwordOk = await bcrypt.compare(currentPassword, admin.passwordHash);

  if (!passwordOk) {
    throw new Error("当前密码不正确。");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      tokenVersion: admin.tokenVersion + 1,
    },
    select: { id: true },
  });

  cookieStore.delete(ADMIN_SESSION_COOKIE);
}
