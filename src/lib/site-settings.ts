import { prisma } from "@/lib/prisma";

export async function getGlobalSiteSettings() {
  return prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global" },
    update: {},
  });
}

export async function isDatabaseRegistrationEnabled() {
  try {
    const settings = await getGlobalSiteSettings();
    return settings.registrationEnabled;
  } catch (error) {
    console.warn(
      "[site-settings] falling back to REGISTRATION_ENABLED",
      error
    );
    return process.env.REGISTRATION_ENABLED?.toLowerCase() !== "false";
  }
}
