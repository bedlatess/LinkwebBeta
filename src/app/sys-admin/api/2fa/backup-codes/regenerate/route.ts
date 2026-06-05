import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  decryptTwoFactorSecret,
  generateBackupCodes,
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
  const target =
    actor.type === "SUPER_ADMIN"
      ? await prisma.adminUser.findUnique({
          where: { id: actor.adminId },
          select: {
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        })
      : await prisma.user.findUnique({
          where: { id: actor.userId },
          select: {
            twoFactorEnabled: true,
            twoFactorSecret: true,
          },
        });

  if (!target?.twoFactorEnabled || !target.twoFactorSecret) {
    return NextResponse.json(
      { error: "TWO_FACTOR_NOT_ENABLED" },
      { status: 400 }
    );
  }

  if (!verifyTotpToken(decryptTwoFactorSecret(target.twoFactorSecret), code)) {
    return NextResponse.json(
      { error: "INVALID_TWO_FACTOR_CODE" },
      { status: 400 }
    );
  }

  const backupCodes = generateBackupCodes();

  if (actor.type === "SUPER_ADMIN") {
    await prisma.adminUser.update({
      where: { id: actor.adminId },
      data: { twoFactorBackupCodes: backupCodes.serialized },
    });
  } else {
    await prisma.user.update({
      where: { id: actor.userId },
      data: { twoFactorBackupCodes: backupCodes.serialized },
    });
  }

  return NextResponse.json({
    success: true,
    backupCodes: backupCodes.codes,
  });
}
