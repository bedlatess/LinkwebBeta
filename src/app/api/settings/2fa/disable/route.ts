import { auth } from "@/lib/auth";
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

  let valid = false;

  if (mode === "recovery") {
    valid = verifyAndConsumeBackupCode(user.twoFactorBackupCodes, code).valid;
  } else {
    valid = verifyTotpToken(decryptTwoFactorSecret(user.twoFactorSecret), code);
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

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorConfirmedAt: null,
      twoFactorBackupCodes: null,
    },
  });

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
