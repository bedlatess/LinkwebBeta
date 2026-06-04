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

import NextAuth from "next-auth";
import { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { getGlobalSiteSettings } from "@/lib/site-settings";
import { verifyTurnstileToken } from "@/lib/turnstile";
import bcrypt from "bcryptjs";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_SECRET;

class AccountBannedError extends CredentialsSignin {
  code = "account_banned";
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

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

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
          },
        });

        if (!user || !user.passwordHash) {
          // No user found, or user has no password (OAuth-only account)
          return null;
        }

        if (user.isBanned) {
          console.warn("[auth] banned credentials login blocked", {
            userId: user.id,
            email: user.email,
          });
          throw new AccountBannedError();
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // Return user object (NextAuth will create the JWT)
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          image: user.image,
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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = String(user.id);
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },

    /**
     * Expose the user ID on the session object.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // Debug logs in development
  debug: process.env.NODE_ENV === "development",
});
