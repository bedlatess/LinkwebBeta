import { getAdminActor } from "@/lib/admin-action-auth";
import { prisma } from "@/lib/prisma";
import {
  createTotpSetup,
  createTwoFactorSetupToken,
  getTwoFactorCookieOptions,
  TWO_FACTOR_SETUP_COOKIE,
  twoFactorSetupMaxAge,
} from "@/lib/two-factor";
import { NextResponse } from "next/server";

export async function POST() {
  const actor = await getAdminActor();

  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const target =
    actor.type === "SUPER_ADMIN"
      ? await prisma.adminUser.findUnique({
          where: { id: actor.adminId },
          select: { email: true, twoFactorEnabled: true },
        })
      : await prisma.user.findUnique({
          where: { id: actor.userId },
          select: { email: true, username: true, twoFactorEnabled: true },
        });

  if (!target) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (target.twoFactorEnabled) {
    return NextResponse.json(
      { error: "TWO_FACTOR_ALREADY_ENABLED" },
      { status: 409 }
    );
  }

  const actorRef =
    actor.type === "SUPER_ADMIN"
      ? { actorType: "admin" as const, actorId: actor.adminId }
      : { actorType: "user" as const, actorId: actor.userId };
  const accountName =
    "username" in target
      ? target.email ?? target.username ?? actorRef.actorId
      : target.email;
  const setup = await createTotpSetup(accountName);
  const token = await createTwoFactorSetupToken(actorRef, setup.secret);
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
