import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPublicUploadUrl, writeUploadFile } from "@/lib/upload-storage";
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

    const filename = `${session.user.id}-${Date.now()}.${extension}`;
    const publicUrl = getPublicUploadUrl("avatars", filename);
    const bytes = Buffer.from(await file.arrayBuffer());

    await writeUploadFile("avatars", filename, bytes);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: publicUrl },
    });

    return NextResponse.json({ image: publicUrl });
  } catch (error) {
    console.error("[settings/avatar] upload failed", error);
    return NextResponse.json(
      { error: "头像上传失败，请检查容器数据卷权限后重试" },
      { status: 500 }
    );
  }
}
