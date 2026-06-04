"use server";

import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateSiteBasics(formData: FormData) {
  await requireAdminActionSession("permManageSettings");

  const siteTitle = String(formData.get("siteTitle") ?? "").trim();
  const seoDescription = String(formData.get("seoDescription") ?? "").trim();
  const supportEmail = String(formData.get("supportEmail") ?? "").trim();
  const announcementText = String(
    formData.get("announcementText") ?? ""
  ).trim();
  const footerText = String(formData.get("footerText") ?? "").trim();
  const githubUrl = String(formData.get("githubUrl") ?? "").trim();
  const announcementEnabled = formData.get("announcementEnabled") === "on";

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
      supportEmail: supportEmail || null,
      announcementEnabled,
      announcementText: announcementText || null,
      footerText: footerText || "© 2026 PAWN. All rights reserved.",
      githubUrl: githubUrl || "https://github.com/bedlatess/LinkwebBeta",
    },
    update: {
      siteTitle,
      seoDescription:
        seoDescription || "Self-hosted link-in-bio platform",
      supportEmail: supportEmail || null,
      announcementEnabled,
      announcementText: announcementText || null,
      footerText: footerText || "© 2026 PAWN. All rights reserved.",
      githubUrl: githubUrl || "https://github.com/bedlatess/LinkwebBeta",
    },
  });

  revalidatePath("/sys-admin/settings");
  revalidatePath("/");
  revalidatePath("/auth/signin");
}

export async function toggleRegistrationEnabled() {
  await requireAdminActionSession("permManageSettings");

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
  await requireAdminActionSession("permManageSettings");

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

export async function toggleMaintenanceMode() {
  await requireAdminActionSession("permToggleMaintenance");

  const settings = await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
    select: { isMaintenanceMode: true },
  });

  await prisma.siteSettings.update({
    where: { id: "global" },
    data: { isMaintenanceMode: !settings.isMaintenanceMode },
  });

  revalidatePath("/sys-admin/settings");
  revalidatePath("/");
  revalidatePath("/auth/signin");
}
