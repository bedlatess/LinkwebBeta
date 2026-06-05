import {
  createAdminSession,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_TWO_FACTOR_CHALLENGE_COOKIE,
  decryptTwoFactorSecret,
  getTwoFactorCookieOptions,
  verifyAdminTwoFactorChallengeToken,
  verifyAndConsumeBackupCode,
  verifyTotpToken,
} from "@/lib/two-factor";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const challenge = await verifyAdminTwoFactorChallengeToken(request);

  if (!challenge) {
    return NextResponse.json(
      { error: "TWO_FACTOR_SETUP_EXPIRED" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const mode = body?.mode === "recovery" ? "recovery" : "totp";

  const admin = await prisma.adminUser.findUnique({
    where: { id: challenge.adminId },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      tokenVersion: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  });

  if (
    !admin?.isActive ||
    admin.email !== challenge.email ||
    admin.role !== challenge.role ||
    admin.tokenVersion !== challenge.tokenVersion ||
    !admin.twoFactorEnabled ||
    !admin.twoFactorSecret
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (mode === "recovery") {
    const recovery = verifyAndConsumeBackupCode(
      admin.twoFactorBackupCodes,
      code
    );

    if (!recovery.valid) {
      return NextResponse.json(
        { error: "INVALID_RECOVERY_CODE" },
        { status: 400 }
      );
    }

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { twoFactorBackupCodes: recovery.serialized },
      select: { id: true },
    });
  } else {
    const secret = decryptTwoFactorSecret(admin.twoFactorSecret);

    if (!verifyTotpToken(secret, code)) {
      return NextResponse.json(
        { error: "INVALID_TWO_FACTOR_CODE" },
        { status: 400 }
      );
    }
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
  response.cookies.set(ADMIN_TWO_FACTOR_CHALLENGE_COOKIE, "", {
    ...getTwoFactorCookieOptions(0),
    maxAge: 0,
  });

  return response;
}
