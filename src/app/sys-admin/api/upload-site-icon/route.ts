import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

const MAX_FILE_SIZE = 512 * 1024;
export const runtime = "nodejs";

const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
  ["image/x-icon", "ico"],
]);

export async function POST(request: Request) {
  await requireAdminActionSession("permManageSiteSettings");

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const extension = ALLOWED_TYPES.get(file.type);

  if (!extension) {
    return NextResponse.json(
      { error: "Only PNG, JPG, WEBP, SVG or ICO files are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File is too large. Max 512KB." },
      { status: 400 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadDir = path.join(process.cwd(), "public", "uploads", "site");
  await mkdir(uploadDir, { recursive: true });

  const fileName = `site-icon-${Date.now()}.${extension}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, bytes);

  const siteIconUrl = `/uploads/site/${fileName}`;

  await prisma.siteSettings.upsert({
    where: { id: "global" },
    create: { id: "global", siteIconUrl },
    update: { siteIconUrl },
  });

  return NextResponse.json({ success: true, siteIconUrl });
}
