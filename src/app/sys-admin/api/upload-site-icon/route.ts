import { requireAdminActionSession } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import { getPublicUploadUrl, writeUploadFile } from "@/lib/upload-storage";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 512 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
  ["image/svg+xml", "svg"],
  ["image/x-icon", "ico"],
]);

export async function POST(request: Request) {
  try {
    await requireAdminActionSession("permManageSiteSettings");

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择图标文件" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);

    if (!extension) {
      return NextResponse.json(
        { error: "仅支持 PNG、JPG、WEBP、SVG 或 ICO 文件" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "图标文件不能超过 512KB" },
        { status: 400 }
      );
    }

    const fileName = `site-icon-${Date.now()}.${extension}`;
    const siteIconUrl = getPublicUploadUrl("site", fileName);
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeUploadFile("site", fileName, bytes);

    await prisma.siteSettings.upsert({
      where: { id: "global" },
      create: { id: "global", siteIconUrl },
      update: { siteIconUrl },
    });

    return NextResponse.json({ success: true, siteIconUrl });
  } catch (error) {
    console.error("[sys-admin/upload-site-icon] upload failed", error);
    return NextResponse.json(
      { error: "图标上传失败，请检查容器数据卷权限后重试" },
      { status: 500 }
    );
  }
}
