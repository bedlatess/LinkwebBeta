-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("allowCustomCSS", "allowCustomFont", "allowTips", "bannedAt", "bannedReason", "bio", "createdAt", "customDomain", "email", "emailVerified", "id", "image", "isBanned", "name", "passwordHash", "updatedAt", "username") SELECT "allowCustomCSS", "allowCustomFont", "allowTips", "bannedAt", "bannedReason", "bio", "createdAt", "customDomain", "email", "emailVerified", "id", "image", "isBanned", "name", "passwordHash", "updatedAt", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_customDomain_key" ON "User"("customDomain");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
