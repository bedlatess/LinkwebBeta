import {
  createAdminSession,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_TWO_FACTOR_CHALLENGE_COOKIE,
  adminTwoFactorChallengeMaxAge,
  createAdminTwoFactorChallengeToken,
  getTwoFactorCookieOptions,
} from "@/lib/two-factor";
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
      twoFactorEnabled: true,
    },
  });

  if (!admin?.isActive) {
    return NextResponse.json(INVALID_LOGIN_RESPONSE, { status: 401 });
  }

  const passwordOk = await bcrypt.compare(password, admin.passwordHash);

  if (!passwordOk) {
    return NextResponse.json(INVALID_LOGIN_RESPONSE, { status: 401 });
  }

  if (admin.twoFactorEnabled) {
    const token = await createAdminTwoFactorChallengeToken({
      adminId: admin.id,
      email: admin.email,
      role: admin.role,
      tokenVersion: admin.tokenVersion,
    });
    const response = NextResponse.json({ requiresTwoFactor: true });

    response.cookies.set(
      ADMIN_TWO_FACTOR_CHALLENGE_COOKIE,
      token,
      getTwoFactorCookieOptions(adminTwoFactorChallengeMaxAge)
    );

    return response;
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
