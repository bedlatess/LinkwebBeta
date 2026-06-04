"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

function cleanNullable(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function updateManagedUser(userId: string, formData: FormData) {
  await requireAdminActionSession();

  const name = cleanNullable(formData.get("name"));
  const bio = cleanNullable(formData.get("bio"));
  const tipEnabled = formData.get("tipEnabled") === "on";
  const paypalEmail = cleanNullable(formData.get("paypalEmail"));
  const customTipUrl = cleanNullable(formData.get("customTipUrl"));
  const cryptoAddress = cleanNullable(formData.get("cryptoAddress"));

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { name, bio },
      select: { id: true },
    }),
    prisma.themeConfig.upsert({
      where: { userId },
      create: {
        userId,
        tipEnabled,
        paypalEmail,
        customTipUrl,
        cryptoAddress,
      },
      update: {
        tipEnabled,
        paypalEmail,
        customTipUrl,
        cryptoAddress,
      },
    }),
  ]);

  revalidatePath(`/sys-admin/users/${userId}/edit`);
  revalidatePath("/sys-admin/users");
}

export async function resetManagedUserPassword(
  userId: string,
  formData: FormData
) {
  await requireAdminActionSession();

  const password = String(formData.get("password") ?? "");

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  });

  revalidatePath(`/sys-admin/users/${userId}/edit`);
}
