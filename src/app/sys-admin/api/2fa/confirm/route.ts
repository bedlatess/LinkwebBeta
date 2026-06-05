import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  encryptTwoFactorSecret,
  generateBackupCodes,
  getTwoFactorCookieOptions,
  TWO_FACTOR_SETUP_COOKIE,
  verifyTotpToken,
  verifyTwoFactorSetupToken,
} from "@/lib/two-factor";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const actor = await getAdminActor();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const actorRef =
    actor.type === "SUPER_ADMIN"
      ? { actorType: "admin" as const, actorId: actor.adminId }
      : { actorType: "user" as const, actorId: actor.userId };
  const pendingSecret = await verifyTwoFactorSetupToken(request, actorRef);

  if (!pendingSecret) {
    return NextResponse.json(
      { error: "TWO_FACTOR_SETUP_EXPIRED" },
      { status: 400 }
    );
  }

  if (!verifyTotpToken(pendingSecret, code)) {
    return NextResponse.json(
      { error: "INVALID_TWO_FACTOR_CODE" },
      { status: 400 }
    );
  }

  const backupCodes = generateBackupCodes();
  const data = {
    twoFactorEnabled: true,
    twoFactorSecret: encryptTwoFactorSecret(pendingSecret),
    twoFactorConfirmedAt: new Date(),
    twoFactorBackupCodes: backupCodes.serialized,
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

  const response = NextResponse.json({
    success: true,
    backupCodes: backupCodes.codes,
  });

  response.cookies.set(TWO_FACTOR_SETUP_COOKIE, "", {
    ...getTwoFactorCookieOptions(0),
    maxAge: 0,
  });

  return response;
}
