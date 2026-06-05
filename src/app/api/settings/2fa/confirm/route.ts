import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTwoFactorVerificationToken,
  encryptTwoFactorSecret,
  generateBackupCodes,
  getTwoFactorCookieOptions,
  TWO_FACTOR_COOKIE,
  TWO_FACTOR_SETUP_COOKIE,
  twoFactorCookieMaxAge,
  verifyTotpToken,
  verifyTwoFactorSetupToken,
} from "@/lib/two-factor";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const actor = { actorType: "user" as const, actorId: session.user.id };
  const pendingSecret = await verifyTwoFactorSetupToken(request, actor);

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

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: encryptTwoFactorSecret(pendingSecret),
      twoFactorConfirmedAt: new Date(),
      twoFactorBackupCodes: backupCodes.serialized,
    },
  });

  const verificationToken = await createTwoFactorVerificationToken(actor);
  const response = NextResponse.json({
    success: true,
    backupCodes: backupCodes.codes,
  });

  response.cookies.set(TWO_FACTOR_SETUP_COOKIE, "", {
    ...getTwoFactorCookieOptions(0),
    maxAge: 0,
  });
  response.cookies.set(
    TWO_FACTOR_COOKIE,
    verificationToken,
    getTwoFactorCookieOptions(twoFactorCookieMaxAge)
  );

  return response;
}
