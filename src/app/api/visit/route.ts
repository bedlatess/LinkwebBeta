/**
 * Visit Log API — POST (record a link click)
 *
 * Public endpoint — no authentication required.
 * Privacy-preserving: only stores linkId + timestamp + hashed IP.
 * No cookies, no fingerprinting, no PII.
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyAdminSessionFromRequest } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/ip-ban";
import { createHash } from "crypto";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;

type RateLimitEntry = {
  count: number;
  windowStart: number;
};

const globalForVisitRateLimit = globalThis as typeof globalThis & {
  linkwebVisitRateLimit?: Map<string, RateLimitEntry>;
  linkwebVisitRateLimitLastCleanup?: number;
  linkwebAutoBannedIps?: Set<string>;
};

const rateLimitStore =
  globalForVisitRateLimit.linkwebVisitRateLimit ??
  new Map<string, RateLimitEntry>();

globalForVisitRateLimit.linkwebVisitRateLimit = rateLimitStore;
const autoBannedIps =
  globalForVisitRateLimit.linkwebAutoBannedIps ?? new Set<string>();
globalForVisitRateLimit.linkwebAutoBannedIps = autoBannedIps;

function hashIp(ip: string) {
  const salt = process.env.NEXTAUTH_SECRET ?? "";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex").slice(0, 32);
}

function isRateLimited(ipHash: string) {
  const now = Date.now();

  if (
    !globalForVisitRateLimit.linkwebVisitRateLimitLastCleanup ||
    now - globalForVisitRateLimit.linkwebVisitRateLimitLastCleanup >=
      RATE_LIMIT_WINDOW_MS
  ) {
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
    globalForVisitRateLimit.linkwebVisitRateLimitLastCleanup = now;
  }

  const current = rateLimitStore.get(ipHash);

  if (!current || now - current.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ipHash, { count: 1, windowStart: now });
    return false;
  }

  current.count += 1;
  return current.count > RATE_LIMIT_MAX_REQUESTS;
}

async function isAdminWhitelistRequest(request: Request) {
  const adminSession = await verifyAdminSessionFromRequest(request);
  if (adminSession) {
    return true;
  }

  const session = await auth();
  return session?.user?.role === "ADMIN";
}

export async function POST(request: Request) {
  const body = await request.json();
  const { linkId } = body;

  if (!linkId) {
    return NextResponse.json({ error: "linkId is required" }, { status: 400 });
  }

  // Privacy-preserving: hash the salted IP before touching SQLite.
  const ip =
    getClientIp(request.headers) ||
    "0.0.0.0";
  const ipHash = hashIp(ip);

  if (isRateLimited(ipHash)) {
    const isAdminWhitelisted = await isAdminWhitelistRequest(request);

    if (ip !== "0.0.0.0" && !autoBannedIps.has(ip) && !isAdminWhitelisted) {
      autoBannedIps.add(ip);
      await prisma.ipBanRule.upsert({
        where: { value: ip },
        create: {
          value: ip,
          reason: "自动检测到点击接口高频请求",
          source: "auto",
          isActive: true,
        },
        update: {
          reason: "自动检测到点击接口高频请求",
          source: "auto",
          isActive: true,
        },
      });
    }

    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  // Verify the link exists
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { id: true },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Truncate user agent to 256 chars
  const userAgent = (request.headers.get("user-agent") ?? "unknown").slice(
    0,
    256
  );

  // Truncate referer
  const referer = (request.headers.get("referer") ?? null)?.slice(0, 512);

  await prisma.visitLog.create({
    data: {
      linkId,
      ipHash,
      userAgent,
      referer,
    },
  });

  return NextResponse.json({ success: true });
}
