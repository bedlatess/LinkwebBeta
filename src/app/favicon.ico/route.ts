import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function normalizeIconUrl(iconUrl: string | null | undefined) {
  const value = iconUrl?.trim();
  if (!value) return "/default-favicon.ico";

  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol)
      ? value
      : "/default-favicon.ico";
  } catch {
    return value.startsWith("/") ? value : "/default-favicon.ico";
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);

  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { id: "global" },
      select: { siteIconUrl: true },
    });

    return NextResponse.redirect(
      new URL(normalizeIconUrl(settings?.siteIconUrl), requestUrl.origin)
    );
  } catch (error) {
    console.warn("[favicon] failed to load site icon", error);
    return NextResponse.redirect(
      new URL("/default-favicon.ico", requestUrl.origin)
    );
  }
}
