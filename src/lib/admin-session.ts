import { prisma } from "@/lib/prisma";
import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const ADMIN_SESSION_COOKIE = "__Host-linkweb-admin";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

type AdminSessionPayload = {
  adminId: string;
  email: string;
  role: string;
  tokenVersion: number;
};

export type AdminSession = AdminSessionPayload & {
  exp?: number;
};

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET or NEXTAUTH_SECRET is required.");
  }

  return new TextEncoder().encode(secret);
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  };
}

export async function createAdminSession(
  adminId: string,
  email: string,
  role: string,
  tokenVersion: number
) {
  return new SignJWT({ adminId, email, role, tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_MAX_AGE_SECONDS}s`)
    .sign(getAdminSessionSecret());
}

export function setAdminSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(ADMIN_SESSION_COOKIE, token, getCookieOptions());
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
}

function readAdminToken(request: Request | NextRequest) {
  if ("cookies" in request) {
    return request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  return cookie?.slice(ADMIN_SESSION_COOKIE.length + 1);
}

export async function verifyAdminSessionFromRequest(
  request: Request | NextRequest
): Promise<AdminSession | null> {
  const token = readAdminToken(request);

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getAdminSessionSecret());
    const adminId = payload.adminId;
    const email = payload.email;
    const role = payload.role;
    const tokenVersion = payload.tokenVersion;

    if (
      typeof adminId !== "string" ||
      typeof email !== "string" ||
      typeof role !== "string" ||
      typeof tokenVersion !== "number"
    ) {
      return null;
    }

    const admin = await prisma.adminUser.findUnique({
      where: { id: adminId },
      select: {
        email: true,
        role: true,
        isActive: true,
        tokenVersion: true,
      },
    });

    if (
      !admin?.isActive ||
      admin.email !== email ||
      admin.role !== role ||
      admin.tokenVersion !== tokenVersion
    ) {
      return null;
    }

    return {
      adminId,
      email,
      role,
      tokenVersion,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
