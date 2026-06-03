import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@linkweb.local";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, username: true },
  });

  const adminUsernameOwner = await prisma.user.findUnique({
    where: { username: "admin" },
    select: { id: true },
  });

  const canUseAdminUsername =
    !adminUsernameOwner || adminUsernameOwner.id === existing?.id;

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: {
          name: "Admin",
          passwordHash,
          ...(canUseAdminUsername ? { username: "admin" } : {}),
        },
        select: { id: true },
      })
    : await prisma.user.create({
        data: {
          email,
          name: "Admin",
          username: canUseAdminUsername ? "admin" : null,
          passwordHash,
        },
        select: { id: true },
      });

  await prisma.themeConfig.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      bgType: "gradient",
      bgValue: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      bgBlur: 12,
      buttonStyle: "rounded",
    },
  });

  console.log(`Admin account is ready: ${email} / ${password}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
