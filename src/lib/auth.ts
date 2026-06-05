/**
 * NextAuth.js v5 Authentication Configuration
 *
 * Providers:
 *   - Credentials (email/password) — for local admin access
 *   - GitHub (OAuth 2.0) — configured but requires env vars
 *   - Google (OAuth 2.0) — configured but requires env vars
 *
 * Adapter: Prisma (SQLite/PostgreSQL)
 * Session strategy: JWT (default)
 */

import NextAuth, { CredentialsSignin, type DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { getGlobalSiteSettings } from "@/lib/site-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import {
  decryptTwoFactorSecret,
  verifyAndConsumeBackupCode,
  verifyTotpToken,
} from "@/lib/two-factor";
import bcrypt from "bcryptjs";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_SECRET;

export const ADMIN_PERMISSION_FIELDS = [
  "permManageUsers",
  "permDeleteUsers",
  "permManageLinks",
  "permManageSettings",
  "permToggleMaintenance",
  "permViewUsers",
  "permBanUsers",
  "permEditUsers",
  "permResetUserPasswords",
  "permManageUserEntitlements",
  "permViewLinks",
  "permDeleteLinks",
  "permManageSiteSettings",
  "permManageAuthSettings",
  "permRunMaintenance",
] as const;

export type AdminPermissionField = (typeof ADMIN_PERMISSION_FIELDS)[number];
export type UserRole = "USER" | "ADMIN";
export type AdminPermissionClaims = Record<AdminPermissionField, boolean>;

const EMPTY_ADMIN_PERMISSIONS: AdminPermissionClaims = {
  permManageUsers: false,
  permDeleteUsers: false,
  permManageLinks: false,
  permManageSettings: false,
  permToggleMaintenance: false,
  permViewUsers: false,
  permBanUsers: false,
  permEditUsers: false,
  permResetUserPasswords: false,
  permManageUserEntitlements: false,
  permViewLinks: false,
  permDeleteLinks: false,
  permManageSiteSettings: false,
  permManageAuthSettings: false,
  permRunMaintenance: false,
};

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: UserRole;
      twoFactorVerifiedAt?: number;
    } & AdminPermissionClaims;
  }

  interface User {
    role?: UserRole;
    twoFactorVerifiedAt?: number;
    permManageUsers?: boolean;
    permDeleteUsers?: boolean;
    permManageLinks?: boolean;
    permManageSettings?: boolean;
    permToggleMaintenance?: boolean;
    permViewUsers?: boolean;
    permBanUsers?: boolean;
    permEditUsers?: boolean;
    permResetUserPasswords?: boolean;
    permManageUserEntitlements?: boolean;
    permViewLinks?: boolean;
    permDeleteLinks?: boolean;
    permManageSiteSettings?: boolean;
    permManageAuthSettings?: boolean;
    permRunMaintenance?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    twoFactorVerifiedAt?: number;
    permManageUsers?: boolean;
    permDeleteUsers?: boolean;
    permManageLinks?: boolean;
    permManageSettings?: boolean;
    permToggleMaintenance?: boolean;
    permViewUsers?: boolean;
    permBanUsers?: boolean;
    permEditUsers?: boolean;
    permResetUserPasswords?: boolean;
    permManageUserEntitlements?: boolean;
    permViewLinks?: boolean;
    permDeleteLinks?: boolean;
    permManageSiteSettings?: boolean;
    permManageAuthSettings?: boolean;
    permRunMaintenance?: boolean;
  }
}

class AccountBannedError extends CredentialsSignin {
  code = "account_banned";
}

class TwoFactorRequiredError extends CredentialsSignin {
  code = "two_factor_required";
}

class TwoFactorUnavailableError extends CredentialsSignin {
  code = "two_factor_unavailable";
}

class InvalidTwoFactorCodeError extends CredentialsSignin {
  code = "invalid_two_factor_code";
}

function normalizeAdminClaims(user: Partial<AdminPermissionClaims> & { role?: string } | null) {
  const legacyManageUsers = user?.permManageUsers ?? false;
  const legacyManageLinks = user?.permManageLinks ?? false;
  const legacyManageSettings = user?.permManageSettings ?? false;

  return {
    role: (user?.role === "ADMIN" ? "ADMIN" : "USER") as UserRole,
    permManageUsers: user?.permManageUsers ?? false,
    permDeleteUsers: user?.permDeleteUsers ?? false,
    permManageLinks: user?.permManageLinks ?? false,
    permManageSettings: user?.permManageSettings ?? false,
    permToggleMaintenance: user?.permToggleMaintenance ?? false,
    permViewUsers: user?.permViewUsers ?? legacyManageUsers,
    permBanUsers: user?.permBanUsers ?? legacyManageUsers,
    permEditUsers: user?.permEditUsers ?? legacyManageUsers,
    permResetUserPasswords:
      user?.permResetUserPasswords ?? legacyManageUsers,
    permManageUserEntitlements:
      user?.permManageUserEntitlements ?? legacyManageUsers,
    permViewLinks: user?.permViewLinks ?? legacyManageLinks,
    permDeleteLinks: user?.permDeleteLinks ?? legacyManageLinks,
    permManageSiteSettings:
      user?.permManageSiteSettings ?? legacyManageSettings,
    permManageAuthSettings:
      user?.permManageAuthSettings ?? legacyManageSettings,
    permRunMaintenance: user?.permRunMaintenance ?? legacyManageUsers,
  };
}

async function loadUserAdminClaims(
  userId?: string | null,
  email?: string | null
) {
  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: true,
          permManageUsers: true,
          permDeleteUsers: true,
          permManageLinks: true,
          permManageSettings: true,
          permToggleMaintenance: true,
          permViewUsers: true,
          permBanUsers: true,
          permEditUsers: true,
          permResetUserPasswords: true,
          permManageUserEntitlements: true,
          permViewLinks: true,
          permDeleteLinks: true,
          permManageSiteSettings: true,
          permManageAuthSettings: true,
          permRunMaintenance: true,
        },
      })
    : email
    ? await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        select: {
          role: true,
          permManageUsers: true,
          permDeleteUsers: true,
          permManageLinks: true,
          permManageSettings: true,
          permToggleMaintenance: true,
          permViewUsers: true,
          permBanUsers: true,
          permEditUsers: true,
          permResetUserPasswords: true,
          permManageUserEntitlements: true,
          permViewLinks: true,
          permDeleteLinks: true,
          permManageSiteSettings: true,
          permManageAuthSettings: true,
          permRunMaintenance: true,
        },
      })
    : null;

  return normalizeAdminClaims(user);
}

function applyClaimsToToken(token: JWT, claims: AdminPermissionClaims & { role: UserRole }) {
  token.role = claims.role;
  for (const field of ADMIN_PERMISSION_FIELDS) {
    token[field] = claims[field];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
  trustHost: true,

  providers: [
    // ═══════════════════════════════════════════════════════════════
    //  Credentials Provider — local email/password login
    //  Used for development and as a fallback when OAuth is not configured
    // ═══════════════════════════════════════════════════════════════
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@linkweb.local" },
        password: { label: "Password", type: "password" },
        twoFactorCode: { label: "Two-Factor Code", type: "text" },
        twoFactorMode: { label: "Two-Factor Mode", type: "text" },
        turnstileToken: { label: "Turnstile Token", type: "hidden" },
      },
      async authorize(credentials, request) {
        const turnstile = await verifyTurnstileToken(
          credentials?.turnstileToken,
          request,
          "login"
        );

        if (!turnstile.success) {
          console.warn("[auth] Turnstile login verification failed", {
            codes: turnstile.codes,
            skipped: turnstile.skipped,
          });
          return null;
        }

        if (!credentials?.email) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password =
          typeof credentials.password === "string"
            ? credentials.password
            : "";
        const twoFactorCode =
          typeof credentials.twoFactorCode === "string"
            ? credentials.twoFactorCode
            : "";
        const twoFactorMode =
          credentials.twoFactorMode === "recovery" ? "recovery" : "totp";

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            passwordHash: true,
            isBanned: true,
            role: true,
            permManageUsers: true,
            permDeleteUsers: true,
            permManageLinks: true,
            permManageSettings: true,
            permToggleMaintenance: true,
            permViewUsers: true,
            permBanUsers: true,
            permEditUsers: true,
            permResetUserPasswords: true,
            permManageUserEntitlements: true,
            permViewLinks: true,
            permDeleteLinks: true,
            permManageSiteSettings: true,
            permManageAuthSettings: true,
            permRunMaintenance: true,
            twoFactorEnabled: true,
            twoFactorSecret: true,
            twoFactorConfirmedAt: true,
            twoFactorBackupCodes: true,
          },
        });

        if (!user) {
          // No user found.
          return null;
        }

        const hasPassword = Boolean(user.passwordHash);
        const isTwoFactorLogin = Boolean(twoFactorCode.trim());

        if (!hasPassword && !isTwoFactorLogin) {
          // OAuth-only account without a local password.
          return null;
        }

        if (user.isBanned) {
          console.warn("[auth] banned credentials login blocked", {
            userId: user.id,
            email: user.email,
          });
          throw new AccountBannedError();
        }

        if (user.twoFactorEnabled) {
          if (twoFactorCode.trim()) {
            if (!user.twoFactorSecret) {
              throw new TwoFactorUnavailableError();
            }

            if (twoFactorMode === "recovery") {
              const recovery = verifyAndConsumeBackupCode(
                user.twoFactorBackupCodes,
                twoFactorCode
              );

              if (!recovery.valid) {
                throw new InvalidTwoFactorCodeError();
              }

              await prisma.user.update({
                where: { id: user.id },
                data: { twoFactorBackupCodes: recovery.serialized },
                select: { id: true },
              });
            } else if (
              !verifyTotpToken(
                decryptTwoFactorSecret(user.twoFactorSecret),
                twoFactorCode
              )
            ) {
              throw new InvalidTwoFactorCodeError();
            }
          } else if (password) {
            if (!user.passwordHash) {
              return null;
            }

            const passwordOk = await bcrypt.compare(password, user.passwordHash);

            if (!passwordOk) {
              return null;
            }

            throw new TwoFactorRequiredError();
          } else {
            return null;
          }
        } else if (isTwoFactorLogin) {
          throw new TwoFactorUnavailableError();
        } else if (!password || !user.passwordHash) {
          return null;
        }

        const passwordHash = user.passwordHash;
        const isValid =
          user.twoFactorEnabled ||
          (passwordHash ? await bcrypt.compare(password, passwordHash) : false);
        if (!isValid) {
          return null;
        }

        // Return user object (NextAuth will create the JWT)
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role === "ADMIN" ? "ADMIN" : "USER",
          permManageUsers: user.permManageUsers,
          permDeleteUsers: user.permDeleteUsers,
          permManageLinks: user.permManageLinks,
          permManageSettings: user.permManageSettings,
          permToggleMaintenance: user.permToggleMaintenance,
          permViewUsers: user.permViewUsers,
          permBanUsers: user.permBanUsers,
          permEditUsers: user.permEditUsers,
          permResetUserPasswords: user.permResetUserPasswords,
          permManageUserEntitlements: user.permManageUserEntitlements,
          permViewLinks: user.permViewLinks,
          permDeleteLinks: user.permDeleteLinks,
          permManageSiteSettings: user.permManageSiteSettings,
          permManageAuthSettings: user.permManageAuthSettings,
          permRunMaintenance: user.permRunMaintenance,
          twoFactorVerifiedAt: user.twoFactorEnabled ? Date.now() : undefined,
        };
      },
    }),

    // ═══════════════════════════════════════════════════════════════
    //  OAuth Providers — activate when GITHUB_CLIENT_ID etc. are set
    //  These will gracefully not appear on the sign-in page if env
    //  vars are empty, but the routes are registered.
    // ═══════════════════════════════════════════════════════════════
    ...(githubClientId && githubClientSecret
      ? [
          GitHub({
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          }),
        ]
      : []),
    ...(googleClientId && googleClientSecret
      ? [
          Google({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          }),
        ]
      : []),
  ],

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {
    /**
     * Block banned accounts across Credentials and OAuth sign-in flows.
     */
    async signIn({ user, account }) {
      if (account?.provider && account.provider !== "credentials") {
        const settings = await getGlobalSiteSettings();

        if (!settings.oauthEnabled) {
          console.warn("[auth] OAuth sign-in blocked by global settings", {
            provider: account.provider,
            email: user.email,
          });
          return "/auth/error?error=OAuthDisabled";
        }
      }

      const userId = user.id ? String(user.id) : null;
      const email = user.email?.toLowerCase().trim();

      const dbUser = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { isBanned: true },
          })
        : email
        ? await prisma.user.findUnique({
            where: { email },
            select: { isBanned: true },
          })
        : null;

      if (dbUser?.isBanned) {
        console.warn("[auth] banned sign-in blocked", { userId, email });
        return "/auth/error?error=AccountBanned";
      }

      return true;
    },

    /**
     * Enrich the JWT with the user's database ID and provider info.
     */
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = String(user.id);
        token.twoFactorVerifiedAt =
          typeof user.twoFactorVerifiedAt === "number"
            ? user.twoFactorVerifiedAt
            : undefined;
        applyClaimsToToken(
          token,
          await loadUserAdminClaims(String(user.id), user.email ?? token.email)
        );
      } else if (token.id && (!token.role || trigger === "update")) {
        applyClaimsToToken(
          token,
          await loadUserAdminClaims(token.id, token.email)
        );
      }

      if (account) {
        token.provider = account.provider;
      }

      token.role ??= "USER";
      for (const field of ADMIN_PERMISSION_FIELDS) {
        token[field] ??= EMPTY_ADMIN_PERMISSIONS[field];
      }

      return token;
    },

    /**
     * Expose the user ID on the session object.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
        session.user.twoFactorVerifiedAt =
          typeof token.twoFactorVerifiedAt === "number"
            ? token.twoFactorVerifiedAt
            : undefined;
        session.user.permManageUsers = token.permManageUsers === true;
        session.user.permDeleteUsers = token.permDeleteUsers === true;
        session.user.permManageLinks = token.permManageLinks === true;
        session.user.permManageSettings = token.permManageSettings === true;
        session.user.permToggleMaintenance =
          token.permToggleMaintenance === true;
        session.user.permViewUsers = token.permViewUsers === true;
        session.user.permBanUsers = token.permBanUsers === true;
        session.user.permEditUsers = token.permEditUsers === true;
        session.user.permResetUserPasswords =
          token.permResetUserPasswords === true;
        session.user.permManageUserEntitlements =
          token.permManageUserEntitlements === true;
        session.user.permViewLinks = token.permViewLinks === true;
        session.user.permDeleteLinks = token.permDeleteLinks === true;
        session.user.permManageSiteSettings =
          token.permManageSiteSettings === true;
        session.user.permManageAuthSettings =
          token.permManageAuthSettings === true;
        session.user.permRunMaintenance = token.permRunMaintenance === true;
      }
      return session;
    },
  },

  // Debug logs in development
  debug: process.env.NODE_ENV === "development",
});
