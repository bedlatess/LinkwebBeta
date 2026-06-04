import { getUploadPath } from "@/lib/upload-paths";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;

  if (
    segments.length !== 2 ||
    segments.some((segment) => segment.includes("..") || segment.includes("/"))
  ) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const [folder, filename] = segments;
  if (!["avatars", "site"].includes(folder)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  try {
    const file = await readFile(getUploadPath(folder, filename));
    const contentType =
      CONTENT_TYPES[path.extname(filename).toLowerCase()] ||
      "application/octet-stream";

    return new NextResponse(file, {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Type": contentType,
      },
    });
  } catch {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }
}
