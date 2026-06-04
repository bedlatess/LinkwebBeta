import {
  createAdminSession,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

const INVALID_LOGIN_RESPONSE = {
  error: "管理员邮箱或密码错误。",
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email =
    typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json(INVALID_LOGIN_RESPONSE, { status: 401 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      role: true,
      isActive: true,
      tokenVersion: true,
    },
  });

  if (!admin?.isActive) {
    return NextResponse.json(INVALID_LOGIN_RESPONSE, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordOk) {
    return NextResponse.json(INVALID_LOGIN_RESPONSE, { status: 401 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { lastLoginAt: new Date() },
    select: { id: true },
  });

  const token = await createAdminSession(
    admin.id,
    admin.email,
    admin.role,
    admin.tokenVersion
  );
  const response = NextResponse.json({ success: true });
  setAdminSessionCookie(response, token);

  return response;
}
