import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  decryptTwoFactorSecret,
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

  return NextResponse.json({ success: true });
}
