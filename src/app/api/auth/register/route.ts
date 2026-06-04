/**
 * Registration API — POST
 *
 * Public endpoint. Creates a new user account with:
 *   - bcrypt password hashing (12 rounds)
 *   - Email + Username uniqueness validation
 *   - Username format validation (alphanumeric + underscore only)
 *   - Reserved username blocklist
 *   - Auto-creates default ThemeConfig (Glassmorphism preset)
 */

import { NextResponse } from "next/server";
import { isDatabaseRegistrationEnabled } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";
import { verifyTurnstileToken } from "@/lib/turnstile";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

// System reserved usernames — cannot be registered
const RESERVED = new Set([
  "dashboard",
  "auth",
  "api",
  "_next",
  "favicon.ico",
  "public",
  "admin", // legacy admin
  "linkweb",
  "settings",
  "appearance",
  "links",
  "analytics",
]);

// Username regex: letters, numbers, underscores, 3-30 chars
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;

export async function POST(request: Request) {
  try {
    if (!(await isDatabaseRegistrationEnabled())) {
      return NextResponse.json(
        { error: "当前站点已关闭新用户注册" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
    const username =
      typeof body?.username === "string"
        ? body.username.toLowerCase().trim()
        : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const turnstileToken = body?.turnstileToken;

    const turnstile = await verifyTurnstileToken(
      turnstileToken,
      request,
      "register"
    );

    if (!turnstile.success) {
      return NextResponse.json(
        { error: turnstile.error ?? "人机验证未通过，请重试。" },
        { status: 403 }
      );
    }

    // ─── Validation ───
    const errors: string[] = [];

    if (!email || !email.includes("@")) {
      errors.push("请提供有效的邮箱地址");
    }

    if (!username) {
      errors.push("请提供用户名");
    } else if (!USERNAME_REGEX.test(username)) {
      errors.push("用户名只允许英文字母、数字和下划线，长度 3-30 个字符");
    } else if (RESERVED.has(username)) {
      errors.push(`用户名 "${username}" 为系统保留字，请使用其他用户名`);
    }

    if (!password || password.length < 6) {
      errors.push("密码长度至少为 6 个字符");
    }

    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join("；") }, { status: 400 });
    }

    // ─── Uniqueness check ───
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 }
      );
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "该用户名已被使用" },
        { status: 409 }
      );
    }

    // ─── Create user + default ThemeConfig in a transaction ───
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          username,
          name: username,
          passwordHash,
        },
        select: {
          id: true,
          email: true,
          username: true,
        },
      });

      // Auto-create default ThemeConfig aligned with the current schema.
      await tx.themeConfig.create({
        data: {
          userId: newUser.id,
          bgType: "gradient",
          bgValue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          bgBlur: 12,
          buttonStyle: "rounded",
        },
        select: { id: true },
      });

      return newUser;
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "邮箱或用户名已被使用" },
        { status: 409 }
      );
    }

    console.error("[register] failed to create account", error);
    return NextResponse.json(
      {
        error:
          "注册服务暂时不可用，请确认数据库迁移已执行且 DATABASE_URL 可访问",
      },
      { status: 500 }
    );
  }
}
