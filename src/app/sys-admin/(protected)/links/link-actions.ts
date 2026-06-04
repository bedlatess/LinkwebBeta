"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteGlobalLink(linkId: string, returnPath = "/sys-admin/links") {
  await requireAdminActionSession("permDeleteLinks");

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true, userId: true },
  });

  if (!link) {
    throw new Error("Link not found");
  }

  await prisma.link.delete({
    where: { id: linkId },
  });

  revalidatePath("/sys-admin/links");
  revalidatePath(`/sys-admin/users/${link.userId}/edit`);
  revalidatePath(`/sys-admin/users/${link.userId}/links`);
  redirect(`${returnPath}?toast=${encodeURIComponent("删除链接成功")}`);
}
