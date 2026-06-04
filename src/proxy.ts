/**
 * LinkWeb Route Guard Proxy (Next.js 16+)
 *
 * Two responsibilities:
 *   1. Auth guard: protect /dashboard/* and sensitive API routes
 *   2. Custom domain rewrite: if the request host is not the main site,
 *      look up the user by customDomain and rewrite to /[username]
 *
 * In Next.js 16, the `middleware.ts` convention is replaced by `proxy.ts`.
 */

import { auth } from "@/lib/auth";
import { verifyAdminSessionFromRequest } from "@/lib/admin-session";
import { findMatchingIpBanRule, getClientIp } from "@/lib/ip-ban";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

// Create a standalone Prisma client for the proxy (Edge-compatible)
// In production this would be a cached singleton, but for SQLite we keep it simple
const getPrisma = (() => {
  let instance: PrismaClient | null = null;
  return () => {
    if (!instance) instance = new PrismaClient();
    return instance;
  };
})();

export default auth(async (req) => {
  const isAuthenticated = !!req.auth;
  const { pathname } = req.nextUrl;
  const rawHost = req.headers.get("host") ?? "";
  const host = rawHost.toLowerCase().replace(/:\d+$/, "");
  const mainHost = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).host.toLowerCase().replace(/:\d+$/, "")
    : "localhost";
  const isSysAdminRoute =
    pathname === "/sys-admin" || pathname.startsWith("/sys-admin/");
  const adminSession = await verifyAdminSessionFromRequest(req);
  const normalSessionUserId = req.auth?.user?.id;
  let hasNormalAdminSession = false;

  if (normalSessionUserId) {
    try {
      const user = await getPrisma().user.findUnique({
        where: { id: normalSessionUserId },
        select: { role: true, isBanned: true },
      });

      hasNormalAdminSession =
        user?.role === "ADMIN" && user.isBanned !== true;
    } catch {
      hasNormalAdminSession = false;
    }
  }
  const isAdminActorRequest = Boolean(adminSession || hasNormalAdminSession);

  // ═══════════════════════════════════════════════════════════════
  //  Admin Guard (independent from regular Auth.js sessions)
  // ═══════════════════════════════════════════════════════════════
  if (isSysAdminRoute) {
    const isAdminPublicRoute =
      pathname === "/sys-admin/login" ||
      pathname.startsWith("/sys-admin/api/login");

    if (isAdminPublicRoute) {
      return NextResponse.next();
    }

    if (!adminSession && !hasNormalAdminSession) {
      if (pathname.startsWith("/sys-admin/api")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const loginUrl = new URL("/sys-admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  IP Ban Guard (admin console and admin actors are fail-open)
  // ═══════════════════════════════════════════════════════════════
  const isBannedPage = pathname === "/banned";
  const isIpBanExempt =
    isSysAdminRoute ||
    isAdminActorRequest ||
    isBannedPage ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico");

  if (!isIpBanExempt) {
    try {
      const clientIp = getClientIp(req.headers);
      const matchedRule = await findMatchingIpBanRule(getPrisma(), clientIp);

      if (matchedRule) {
        if (pathname.startsWith("/api")) {
          return NextResponse.json(
            { error: "Access denied" },
            { status: 403 }
          );
        }

        const bannedUrl = new URL("/banned", req.url);
        bannedUrl.searchParams.set("type", "ip");
        return NextResponse.redirect(bannedUrl);
      }
    } catch {
      // A database hiccup should not lock out legitimate traffic.
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Global Maintenance Mode (admin routes stay reachable)
  // ═══════════════════════════════════════════════════════════════
  const isMaintenancePage = pathname === "/maintenance";
  const isNextAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap.xml");

  if (!isSysAdminRoute && !isBannedPage && !isMaintenancePage && !isNextAsset) {
    try {
      const settings = await getPrisma().siteSettings.findUnique({
        where: { id: "global" },
        select: { isMaintenanceMode: true },
      });

      if (settings?.isMaintenanceMode) {
        const response = NextResponse.rewrite(
          new URL("/maintenance", req.url),
          { status: 503 }
        );
        response.headers.set("Retry-After", "3600");
        return response;
      }
    } catch {
      // If the settings table is missing during migration/bootstrap, keep
      // serving traffic instead of taking the whole site down.
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Custom Domain Rewrite (White-label)
  // ═══════════════════════════════════════════════════════════════
  if (host !== mainHost && host !== "localhost" && !host.endsWith(".localhost")) {
    if (pathname === "/" || pathname === "") {
      try {
        const prisma = getPrisma();
        const user = await prisma.user.findUnique({
          where: { customDomain: host },
          select: { username: true },
        });
        if (user?.username) {
          return NextResponse.rewrite(new URL(`/${user.username}`, req.url));
        }
      } catch {
        // DB lookup failed — fall through to normal routing
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  Auth Guard
  // ═══════════════════════════════════════════════════════════════

  // Allow auth-related pages, NextAuth API routes, and register route
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Protect /dashboard and all sub-routes
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    const userId = req.auth?.user?.id;
    if (userId) {
      try {
        const user = await getPrisma().user.findUnique({
          where: { id: userId },
          select: { isBanned: true },
        });

        if (user?.isBanned) {
          return NextResponse.redirect(new URL("/banned?type=account", req.url));
        }
      } catch {
        return NextResponse.redirect(new URL("/auth/signin", req.url));
      }
    }
  }

  // Protect API routes — return 401 JSON instead of redirect
  if (
    pathname.startsWith("/api/links") ||
    pathname.startsWith("/api/theme") ||
    pathname.startsWith("/api/analytics") ||
    pathname.startsWith("/api/settings")
  ) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = req.auth?.user?.id;
    if (userId) {
      try {
        const user = await getPrisma().user.findUnique({
          where: { id: userId },
          select: { isBanned: true },
        });

        if (user?.isBanned) {
          return NextResponse.json(
            { error: "此账号已被系统管理员封禁" },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  return NextResponse.next();
});

/**
 * Route matcher: run the proxy on ALL routes (needed for custom domain detection).
 * Auth guards are applied selectively within the handler.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
