/**
 * Database Seed Script
 *
 * Creates the default admin test account:
 *   Email: admin@linkweb.local
 *   Password: admin123
 *
 * Run: npx prisma db seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@linkweb.local";
  const password = "admin123";
  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { passwordHash, name: "Admin", username: "admin" },
      })
    : await prisma.user.create({
        data: {
          email,
          name: "Admin",
          username: "admin",
          passwordHash,
        },
      });

  if (existing) {
    console.log(`⚠️  Admin user already exists (${email}). Updating password...`);
  } else {
    console.log(`✅ Created admin user: ${email} / ${password}`);
  }

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

  console.log("✅ Admin theme config is ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
