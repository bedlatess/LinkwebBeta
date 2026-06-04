-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "siteIconUrl" TEXT;

-- Backfill fine-grained permissions from legacy coarse permissions.
UPDATE "User"
SET
    "permViewUsers" = "permManageUsers",
    "permBanUsers" = "permManageUsers",
    "permEditUsers" = "permManageUsers",
    "permResetUserPasswords" = "permManageUsers",
    "permManageUserEntitlements" = "permManageUsers",
    "permRunMaintenance" = "permManageUsers",
    "permViewLinks" = "permManageLinks",
    "permDeleteLinks" = "permManageLinks",
    "permManageSiteSettings" = "permManageSettings",
    "permManageAuthSettings" = "permManageSettings"
WHERE "role" = 'ADMIN';

-- CreateTable
CREATE TABLE "IpBanRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "reason" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "IpBanRule_value_key" ON "IpBanRule"("value");

-- CreateIndex
CREATE INDEX "IpBanRule_isActive_idx" ON "IpBanRule"("isActive");

-- CreateIndex
CREATE INDEX "IpBanRule_source_idx" ON "IpBanRule"("source");

