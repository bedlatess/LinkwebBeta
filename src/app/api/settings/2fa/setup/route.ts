import { auth } from "@/lib/auth";
import {
  createTotpSetup,
  createTwoFactorSetupToken,
  getTwoFactorCookieOptions,
  TWO_FACTOR_SETUP_COOKIE,
  twoFactorSetupMaxAge,
} from "@/lib/two-factor";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      username: true,
      twoFactorEnabled: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json(
      { error: "TWO_FACTOR_ALREADY_ENABLED" },
      { status: 409 }
    );
  }

  const accountName = user.email ?? user.username ?? session.user.id;
  const setup = await createTotpSetup(accountName);
  const token = await createTwoFactorSetupToken(
    { actorType: "user", actorId: session.user.id },
    setup.secret
  );
  const response = NextResponse.json({
    qrCodeDataUrl: setup.qrCodeDataUrl,
    manualSecret: setup.manualSecret,
  });

  response.cookies.set(
    TWO_FACTOR_SETUP_COOKIE,
    token,
    getTwoFactorCookieOptions(twoFactorSetupMaxAge)
  );

  return response;
}
