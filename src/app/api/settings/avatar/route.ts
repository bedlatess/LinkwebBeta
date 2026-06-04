import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_AVATAR_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "请选择头像文件" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type);

    if (!extension) {
      return NextResponse.json(
        { error: "仅支持 JPG、PNG、WEBP 或 GIF 图片" },
        { status: 400 }
      );
    }

    if (file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { error: "头像文件不能超过 2MB" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${session.user.id}-${Date.now()}.${extension}`;
    const diskPath = path.join(uploadDir, filename);
    const publicUrl = `/uploads/avatars/${filename}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeFile(diskPath, bytes);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
    });

    return NextResponse.json({ image: publicUrl });
  } catch (error) {
    console.error("[settings/avatar] upload failed", error);
    return NextResponse.json(
      { error: "头像上传失败，请确认上传目录可写并稍后重试" },
      { status: 500 }
    );
  }
}
