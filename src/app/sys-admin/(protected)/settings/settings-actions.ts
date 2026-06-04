"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSiteBasics(formData: FormData) {
  await requireAdminActionSession();

  const siteTitle = String(formData.get("siteTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();

  if (!siteTitle) {
    throw new Error("Site Title is required");
  }

  await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: {
      id: "global",
      siteTitle,
      seoDescription:
        seoDescription || "Self-hosted link-in-bio platform",
    },
    update: {
      siteTitle,
      seoDescription:
        seoDescription || "Self-hosted link-in-bio platform",
    },
  });

  revalidatePath("/sys-admin/settings");
  revalidatePath("/auth/signin");
}

export async function toggleRegistrationEnabled() {
  await requireAdminActionSession();

  const settings = await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
    select: { registrationEnabled: true },
  });

  await prisma.siteSettings.update({
    where: { id: "global" },
    data: { registrationEnabled: !settings.registrationEnabled },
  });

  revalidatePath("/sys-admin/settings");
  revalidatePath("/auth/signin");
}

export async function toggleOauthEnabled() {
  await requireAdminActionSession();

  const settings = await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
    select: { oauthEnabled: true },
  });

  await prisma.siteSettings.update({
    where: { id: "global" },
    data: { oauthEnabled: !settings.oauthEnabled },
  });

  revalidatePath("/sys-admin/settings");
  revalidatePath("/auth/signin");
}
