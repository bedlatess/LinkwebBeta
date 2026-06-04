import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureUser({
  email,
  password,
  username,
  name,
  bio,
  theme,
}) {
  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true },
  });

  const usernameOwner = username
    ? await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      })
    : null;

  const canUseUsername =
    !username || !usernameOwner || usernameOwner.id === existing?.id;

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          name,
          bio,
          passwordHash,
          ...(canUseUsername ? { username } : {}),
        },
        select: { id: true, username: true },
      })
    : await prisma.user.create({
        data: {
          email,
          name,
          bio,
          username: canUseUsername ? username : null,
          passwordHash,
        },
        select: { id: true, username: true },
      });

  await prisma.themeConfig.upsert({
    where: { userId: user.id },
    update: theme,
    create: {
      userId: user.id,
      ...theme,
    },
  });

  return user;
}

async function ensureDemoLinks(userId) {
  const existingCount = await prisma.link.count({ where: { userId } });

  if (existingCount > 0) {
    return;
  }

  await prisma.link.createMany({
    data: [
      {
        userId,
        title: "Linkweb 项目仓库",
        url: "https://github.com/bedlatess/LinkwebBeta",
        iconName: "github",
        sortOrder: 0,
        groupName: "demo",
      },
      {
        userId,
        title: "登录并管理你的链接",
        url: "/auth/signin",
        iconName: "log-in",
        sortOrder: 1,
        groupName: "demo",
      },
      {
        userId,
        title: "LittleLink 官方项目",
        url: "https://littlelink.io",
        iconName: "external-link",
        sortOrder: 2,
        groupName: "demo",
      },
    ],
  });
}

async function main() {
  const admin = await ensureUser({
    email: "admin@linkweb.local",
    password: "admin123",
    username: "admin",
    name: "Admin",
    bio: "Linkweb 默认系统账号主页",
    theme: {
      bgType: "gradient",
      bgValue: "linear-gradient(135deg, #0f172a 0%, #064e3b 100%)",
      bgBlur: 12,
      buttonStyle: "rounded",
      fontFamily: "system-ui, sans-serif",
    },
  });

  const demo = await ensureUser({
    email: "test@pawn.eu.org",
    password: "test123",
    username: "test",
    name: "Linkweb Demo",
    bio: "这是一个用于公开演示的 Linkweb 主页，展示链接聚合、主题和打赏入口。",
    theme: {
      bgType: "gradient",
      bgValue: "linear-gradient(135deg, #020617 0%, #0f766e 55%, #111827 100%)",
      bgBlur: 14,
      buttonStyle: "rounded",
      fontFamily: "system-ui, sans-serif",
      tipEnabled: true,
      tipTitle: "赞助这个演示",
      customTipUrl: "https://github.com/bedlatess/LinkwebBeta",
    },
  });

  await ensureDemoLinks(demo.id);

  console.log("Default user is ready: admin@linkweb.local / admin123");
  console.log("Demo user is ready: test@pawn.eu.org / test123");
  console.log(`Admin profile: /${admin.username ?? "admin"}`);
  console.log(`Demo profile: /${demo.username ?? "test"}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
