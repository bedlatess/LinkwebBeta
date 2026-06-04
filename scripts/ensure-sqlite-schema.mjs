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
        "isBanned" BOOLEAN NOT NULL DEFAULT false,
        "bannedAt" DATETIME,
        "bannedReason" TEXT,
        "allowCustomCSS" BOOLEAN NOT NULL DEFAULT true,
        "allowCustomFont" BOOLEAN NOT NULL DEFAULT true,
        "allowTips" BOOLEAN NOT NULL DEFAULT true,
        "role" TEXT NOT NULL DEFAULT 'USER',
        "permManageUsers" BOOLEAN NOT NULL DEFAULT false,
        "permDeleteUsers" BOOLEAN NOT NULL DEFAULT false,
        "permManageLinks" BOOLEAN NOT NULL DEFAULT false,
        "permManageSettings" BOOLEAN NOT NULL DEFAULT false,
        "permToggleMaintenance" BOOLEAN NOT NULL DEFAULT false,
        "permViewUsers" BOOLEAN NOT NULL DEFAULT false,
        "permBanUsers" BOOLEAN NOT NULL DEFAULT false,
        "permEditUsers" BOOLEAN NOT NULL DEFAULT false,
        "permResetUserPasswords" BOOLEAN NOT NULL DEFAULT false,
        "permManageUserEntitlements" BOOLEAN NOT NULL DEFAULT false,
        "permViewLinks" BOOLEAN NOT NULL DEFAULT false,
        "permDeleteLinks" BOOLEAN NOT NULL DEFAULT false,
        "permManageSiteSettings" BOOLEAN NOT NULL DEFAULT false,
        "permManageAuthSettings" BOOLEAN NOT NULL DEFAULT false,
        "permRunMaintenance" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  await addColumn("User", "passwordHash", "TEXT");
  await addColumn("User", "customDomain", "TEXT");
  await addColumn("User", "isBanned", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn("User", "bannedAt", "DATETIME");
  await addColumn("User", "bannedReason", "TEXT");
  await addColumn("User", "allowCustomCSS", "BOOLEAN NOT NULL DEFAULT true");
  await addColumn("User", "allowCustomFont", "BOOLEAN NOT NULL DEFAULT true");
  await addColumn("User", "allowTips", "BOOLEAN NOT NULL DEFAULT true");
  await addColumn("User", "role", "TEXT NOT NULL DEFAULT 'USER'");
  await addColumn(
    "User",
    "permManageUsers",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permDeleteUsers",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permManageLinks",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permManageSettings",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permToggleMaintenance",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn("User", "permViewUsers", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn("User", "permBanUsers", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn("User", "permEditUsers", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn(
    "User",
    "permResetUserPasswords",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permManageUserEntitlements",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn("User", "permViewLinks", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn("User", "permDeleteLinks", "BOOLEAN NOT NULL DEFAULT false");
  await addColumn(
    "User",
    "permManageSiteSettings",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permManageAuthSettings",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn(
    "User",
    "permRunMaintenance",
    "BOOLEAN NOT NULL DEFAULT false"
  );

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AdminUser" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "name" TEXT,
      "passwordHash" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'super_admin',
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "tokenVersion" INTEGER NOT NULL DEFAULT 0,
      "lastLoginAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SiteSettings" (
      "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
      "siteTitle" TEXT NOT NULL DEFAULT 'LinkWeb',
      "seoDescription" TEXT NOT NULL DEFAULT 'Self-hosted link-in-bio platform',
      "supportEmail" TEXT,
      "announcementEnabled" BOOLEAN NOT NULL DEFAULT false,
      "announcementText" TEXT,
      "footerText" TEXT NOT NULL DEFAULT '© 2026 PAWN. All rights reserved.',
      "githubUrl" TEXT NOT NULL DEFAULT 'https://github.com/bedlatess/LinkwebBeta',
      "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
      "oauthEnabled" BOOLEAN NOT NULL DEFAULT true,
      "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await addColumn(
    "SiteSettings",
    "isMaintenanceMode",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn("SiteSettings", "supportEmail", "TEXT");
  await addColumn(
    "SiteSettings",
    "announcementEnabled",
    "BOOLEAN NOT NULL DEFAULT false"
  );
  await addColumn("SiteSettings", "announcementText", "TEXT");
  await addColumn(
    "SiteSettings",
    "footerText",
    "TEXT NOT NULL DEFAULT '© 2026 PAWN. All rights reserved.'"
  );
  await addColumn(
    "SiteSettings",
    "githubUrl",
    "TEXT NOT NULL DEFAULT 'https://github.com/bedlatess/LinkwebBeta'"
  );

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
    "User_role_idx",
    'CREATE INDEX "User_role_idx" ON "User"("role")'
  );
  await createIndex(
    "AdminUser_email_key",
    'CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email")'
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
