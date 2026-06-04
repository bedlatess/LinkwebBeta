"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function cleanupExpiredSessions() {
  await requireAdminActionSession("permRunMaintenance");

  await prisma.session.deleteMany({
    where: {
      expires: {
        lt: new Date(),
      },
    },
  });

  revalidatePath("/sys-admin/maintenance");
  redirect(`/sys-admin/maintenance?toast=${encodeURIComponent("过期会话清理成功")}`);
}

export async function cleanupEmptyLinks() {
  await requireAdminActionSession("permRunMaintenance");

  await prisma.link.deleteMany({
    where: {
      OR: [
        { title: "" },
        { url: "" },
        { title: { equals: "" } },
        { url: { equals: "" } },
      ],
    },
  });

  revalidatePath("/sys-admin/maintenance");
  revalidatePath("/sys-admin/links");
  redirect(`/sys-admin/maintenance?toast=${encodeURIComponent("空链接清理成功")}`);
}
