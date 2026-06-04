import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const image =
      typeof body?.image === "string" ? body.image.trim() : undefined;

    if (image !== undefined && image !== "") {
      try {
        const parsed = new URL(image);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json(
            { error: "头像链接必须使用 http 或 https" },
            { status: 400 }
          );
        }
      } catch {
        if (!image.startsWith("/uploads/avatars/")) {
          return NextResponse.json(
            { error: "头像链接格式不正确" },
            { status: 400 }
          );
        }
      }
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { image: image || null },
      select: { image: true },
    });

    return NextResponse.json({ image: user.image });
  } catch (error) {
    console.error("[settings/profile] update failed", error);
    return NextResponse.json(
      { error: "头像保存失败，请稍后重试" },
      { status: 500 }
    );
  }
}
