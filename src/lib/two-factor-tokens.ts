import { createHash } from "crypto";
import { jwtVerify, SignJWT } from "jose";
import type { NextRequest } from "next/server";

export const TWO_FACTOR_COOKIE = "__Host-linkweb-2fa";
export const TWO_FACTOR_SETUP_COOKIE = "__Host-linkweb-2fa-setup";
export const ADMIN_TWO_FACTOR_CHALLENGE_COOKIE =
  "__Host-linkweb-admin-2fa-challenge";

const TWO_FACTOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;
const TWO_FACTOR_SETUP_MAX_AGE_SECONDS = 60 * 10;
const ADMIN_CHALLENGE_MAX_AGE_SECONDS = 60 * 10;

type ActorType = "user" | "admin";

export type TwoFactorActor = {
  actorType: ActorType;
  actorId: string;
};

export type AdminTwoFactorChallenge = {
  adminId: string;
  email: string;
  role: string;
  tokenVersion: number;
};

function getBaseSecret() {
  const secret =
    process.env.TWO_FACTOR_ENCRYPTION_KEY ??
    process.env.NEXTAUTH_SECRET ??
    process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error(
      "TWO_FACTOR_ENCRYPTION_KEY, NEXTAUTH_SECRET, or AUTH_SECRET is required."
    );
  }

  return secret;
}

function getJwtSecret(context: string) {
  return new TextEncoder().encode(
    createHash("sha256").update(`${context}:${getBaseSecret()}`).digest("hex")
  );
}

function readCookieValue(request: Request | NextRequest, name: string) {
  if ("cookies" in request) {
    return request.cookies.get(name)?.value;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie?.slice(name.length + 1);
}

export function getTwoFactorCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge,
  };
}

export async function createTwoFactorVerificationToken(actor: TwoFactorActor) {
  return new SignJWT(actor)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TWO_FACTOR_COOKIE_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret("2fa-verified"));
}

export async function verifyTwoFactorVerificationToken(
  request: Request | NextRequest,
  actor: TwoFactorActor
) {
  const token = readCookieValue(request, TWO_FACTOR_COOKIE);

  if (!token) return false;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret("2fa-verified"));
    return (
      payload.actorType === actor.actorType &&
      payload.actorId === actor.actorId
    );
  } catch {
    return false;
  }
}

export async function createTwoFactorSetupToken(
  actor: TwoFactorActor,
  secret: string
) {
  return new SignJWT({ ...actor, secret })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TWO_FACTOR_SETUP_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret("2fa-setup"));
}

export async function verifyTwoFactorSetupToken(
  request: Request | NextRequest,
  actor: TwoFactorActor
) {
  const token = readCookieValue(request, TWO_FACTOR_SETUP_COOKIE);

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret("2fa-setup"));

    if (
      payload.actorType !== actor.actorType ||
      payload.actorId !== actor.actorId ||
      typeof payload.secret !== "string"
    ) {
      return null;
    }

    return payload.secret;
  } catch {
    return null;
  }
}

export async function createAdminTwoFactorChallengeToken(
  challenge: AdminTwoFactorChallenge
) {
  return new SignJWT(challenge)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_CHALLENGE_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret("admin-2fa-challenge"));
}

export async function verifyAdminTwoFactorChallengeToken(
  request: Request | NextRequest
) {
  const token = readCookieValue(request, ADMIN_TWO_FACTOR_CHALLENGE_COOKIE);

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      getJwtSecret("admin-2fa-challenge")
    );

    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.tokenVersion !== "number"
    ) {
      return null;
    }

    return {
      adminId: payload.adminId,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };
  } catch {
    return null;
  }
}

export const twoFactorCookieMaxAge = TWO_FACTOR_COOKIE_MAX_AGE_SECONDS;
export const twoFactorSetupMaxAge = TWO_FACTOR_SETUP_MAX_AGE_SECONDS;
export const adminTwoFactorChallengeMaxAge = ADMIN_CHALLENGE_MAX_AGE_SECONDS;
