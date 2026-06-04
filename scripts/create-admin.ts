import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const prisma = new PrismaClient();

function getArg(name: string) {
  const prefix = `--${name}=`;
  return process.argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
}

async function promptPassword() {
  const rl = readline.createInterface({ input, output });
  try {
    return await rl.question("Admin password: ");
  } finally {
    rl.close();
  }
}

async function main() {
  const email = getArg("email")?.toLowerCase().trim();
  const name = getArg("name")?.trim() || "Super Admin";
  const rotatePassword = process.argv.includes("--rotate-password");

  if (!email || !email.includes("@")) {
    throw new Error(
      'Usage: npx tsx scripts/create-admin.ts --email=admin@example.com [--name="Admin"] [--rotate-password]'
    );
  }

  const password = process.env.ADMIN_PASSWORD || (await promptPassword());

  if (password.length < 12) {
    throw new Error("Admin password must be at least 12 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await prisma.adminUser.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing && !rotatePassword) {
    throw new Error(
      "Admin already exists. Use --rotate-password to update the password."
    );
  }

  const admin = existing
    ? await prisma.adminUser.update({
        where: { email },
        data: {
          name,
          passwordHash,
          isActive: true,
          tokenVersion: { increment: 1 },
        },
        select: { email: true },
      })
    : await prisma.adminUser.create({
        data: {
          email,
          name,
          passwordHash,
          role: "super_admin",
          isActive: true,
        },
        select: { email: true },
      });

  console.log(`Admin is ready: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
