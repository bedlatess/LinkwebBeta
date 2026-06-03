import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function tableExists(name) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
    name
  );
  return rows.length > 0;
}

async function columnExists(table, column) {
  const rows = await prisma.$queryRawUnsafe(`PRAGMA table_info("${table}")`);
  return rows.some((row) => row.name === column);
}

async function addColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "${table}" ADD COLUMN "${column}" ${definition}`
    );
  }
}

async function createIndex(name, sql) {
  const rows = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type='index' AND name=?",
    name
  );
  if (rows.length === 0) {
    await prisma.$executeRawUnsafe(sql);
  }
}

async function main() {
  await prisma.$executeRawUnsafe("PRAGMA foreign_keys=ON");

  if (!(await tableExists("User"))) {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT,
        "email" TEXT,
        "emailVerified" DATETIME,
        "image" TEXT,
        "bio" TEXT,
        "username" TEXT,
        "passwordHash" TEXT,
        "customDomain" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  await addColumn("User", "passwordHash", "TEXT");
  await addColumn("User", "customDomain", "TEXT");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Account" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "provider" TEXT NOT NULL,
      "providerAccountId" TEXT NOT NULL,
      "refresh_token" TEXT,
      "access_token" TEXT,
      "expires_at" INTEGER,
      "token_type" TEXT,
      "scope" TEXT,
      "id_token" TEXT,
      "session_state" TEXT,
      CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "sessionToken" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "expires" DATETIME NOT NULL,
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VerificationToken" (
      "identifier" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "expires" DATETIME NOT NULL
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Link" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "iconName" TEXT,
      "isVisible" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0,
      "groupName" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Link_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ThemeConfig" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "bgType" TEXT NOT NULL DEFAULT 'color',
      "bgValue" TEXT NOT NULL DEFAULT '#0a0a0a',
      "bgBlur" INTEGER NOT NULL DEFAULT 0,
      "buttonStyle" TEXT NOT NULL DEFAULT 'rounded',
      "fontFamily" TEXT,
      "customCSS" TEXT,
      "tipEnabled" BOOLEAN NOT NULL DEFAULT false,
      "tipTitle" TEXT,
      "paypalEmail" TEXT,
      "customTipUrl" TEXT,
      "cryptoAddress" TEXT,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ThemeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await addColumn("ThemeConfig", "tipEnabled", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn("ThemeConfig", "tipTitle", "TEXT");
  await addColumn("ThemeConfig", "paypalEmail", "TEXT");
  await addColumn("ThemeConfig", "customTipUrl", "TEXT");
  await addColumn("ThemeConfig", "cryptoAddress", "TEXT");

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "VisitLog" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "linkId" TEXT NOT NULL,
      "ipHash" TEXT NOT NULL,
      "userAgent" TEXT NOT NULL,
      "referer" TEXT,
      "country" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VisitLog_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `);

  await createIndex(
    "User_email_key",
    'CREATE UNIQUE INDEX "User_email_key" ON "User"("email")'
  );
  await createIndex(
    "User_username_key",
    'CREATE UNIQUE INDEX "User_username_key" ON "User"("username")'
  );
  await createIndex(
    "User_customDomain_key",
    'CREATE UNIQUE INDEX "User_customDomain_key" ON "User"("customDomain")'
  );
  await createIndex(
    "Account_provider_providerAccountId_key",
    'CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")'
  );
  await createIndex(
    "Session_sessionToken_key",
    'CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken")'
  );
  await createIndex(
    "VerificationToken_token_key",
    'CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token")'
  );
  await createIndex(
    "VerificationToken_identifier_token_key",
    'CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")'
  );
  await createIndex(
    "Link_userId_sortOrder_idx",
    'CREATE INDEX "Link_userId_sortOrder_idx" ON "Link"("userId", "sortOrder")'
  );
  await createIndex(
    "ThemeConfig_userId_key",
    'CREATE UNIQUE INDEX "ThemeConfig_userId_key" ON "ThemeConfig"("userId")'
  );
  await createIndex(
    "VisitLog_linkId_createdAt_idx",
    'CREATE INDEX "VisitLog_linkId_createdAt_idx" ON "VisitLog"("linkId", "createdAt")'
  );

  console.log("SQLite schema is ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
