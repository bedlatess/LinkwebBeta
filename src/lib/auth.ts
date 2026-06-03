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
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_SECRET;

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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          // No user found, or user has no password (OAuth-only account)
          return null;
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
