import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  decryptTwoFactorSecret,
  getTwoFactorCookieOptions,
  TWO_FACTOR_COOKIE,
  TWO_FACTOR_SETUP_COOKIE,
  verifyAndConsumeBackupCode,
  verifyTotpToken,
} from "@/lib/two-factor";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const actor = await getAdminActor();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const mode = body?.mode === "recovery" ? "recovery" : "totp";
  const target =
    actor.type === "SUPER_ADMIN"
      ? await prisma.adminUser.findUnique({
          where: { id: actor.adminId },
          select: {
            twoFactorEnabled: true,
            twoFactorSecret: true,
            twoFactorBackupCodes: true,
          },
        })
      : await prisma.user.findUnique({
          where: { id: actor.userId },
          select: {
            twoFactorEnabled: true,
            twoFactorSecret: true,
            twoFactorBackupCodes: true,
          },
        });

  if (!target?.twoFactorEnabled || !target.twoFactorSecret) {
    return NextResponse.json(
      { error: "TWO_FACTOR_NOT_ENABLED" },
      { status: 400 }
    );
  }

  let valid = false;

  if (mode === "recovery") {
    valid = verifyAndConsumeBackupCode(target.twoFactorBackupCodes, code).valid;
  } else {
    valid = verifyTotpToken(
      decryptTwoFactorSecret(target.twoFactorSecret),
      code
    );
  }

  if (!valid) {
    return NextResponse.json(
      {
        error:
          mode === "recovery"
            ? "INVALID_RECOVERY_CODE"
            : "INVALID_TWO_FACTOR_CODE",
      },
      { status: 400 }
    );
  }

  const data = {
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorConfirmedAt: null,
    twoFactorBackupCodes: null,
  };

  if (actor.type === "SUPER_ADMIN") {
    await prisma.adminUser.update({
      where: { id: actor.adminId },
      data,
    });
  } else {
    await prisma.user.update({
      where: { id: actor.userId },
      data,
    });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(TWO_FACTOR_COOKIE, "", {
    ...getTwoFactorCookieOptions(0),
    maxAge: 0,
  });
  response.cookies.set(TWO_FACTOR_SETUP_COOKIE, "", {
    ...getTwoFactorCookieOptions(0),
    maxAge: 0,
  });

  return response;
}
