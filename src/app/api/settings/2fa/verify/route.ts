import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createTwoFactorVerificationToken,
  decryptTwoFactorSecret,
  getTwoFactorCookieOptions,
  TWO_FACTOR_COOKIE,
  twoFactorCookieMaxAge,
  verifyAndConsumeBackupCode,
  verifyTotpToken,
} from "@/lib/two-factor";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  const mode = body?.mode === "recovery" ? "recovery" : "totp";

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
      twoFactorBackupCodes: true,
    },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "TWO_FACTOR_NOT_ENABLED" },
      { status: 400 }
    );
  }

  if (mode === "recovery") {
    const recovery = verifyAndConsumeBackupCode(
      user.twoFactorBackupCodes,
      code
    );

    if (!recovery.valid) {
      return NextResponse.json(
        { error: "INVALID_RECOVERY_CODE" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { twoFactorBackupCodes: recovery.serialized },
    });
  } else {
    const secret = decryptTwoFactorSecret(user.twoFactorSecret);

    if (!verifyTotpToken(secret, code)) {
      return NextResponse.json(
        { error: "INVALID_TWO_FACTOR_CODE" },
        { status: 400 }
      );
    }
  }

  const token = await createTwoFactorVerificationToken({
    actorType: "user",
    actorId: session.user.id,
  });
  const response = NextResponse.json({ success: true });

  response.cookies.set(
    TWO_FACTOR_COOKIE,
    token,
    getTwoFactorCookieOptions(twoFactorCookieMaxAge)
  );

  return response;
}
