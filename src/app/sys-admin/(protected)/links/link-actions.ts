"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteGlobalLink(linkId: string) {
  await requireAdminActionSession();

  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true },
  });

  if (!link) {
    throw new Error("Link not found");
  }

  await prisma.link.delete({
    where: { id: linkId },
  });

  revalidatePath("/sys-admin/links");
}
