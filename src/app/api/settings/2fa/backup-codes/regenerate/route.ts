import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  decryptTwoFactorSecret,
  generateBackupCodes,
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      twoFactorEnabled: true,
      twoFactorSecret: true,
    },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json(
      { error: "TWO_FACTOR_NOT_ENABLED" },
      { status: 400 }
    );
  }

  if (!verifyTotpToken(decryptTwoFactorSecret(user.twoFactorSecret), code)) {
    return NextResponse.json(
      { error: "INVALID_TWO_FACTOR_CODE" },
      { status: 400 }
    );
  }

  const backupCodes = generateBackupCodes();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorBackupCodes: backupCodes.serialized },
  });

  return NextResponse.json({
    success: true,
    backupCodes: backupCodes.codes,
  });
}
