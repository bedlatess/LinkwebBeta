-- Add TOTP-based two-factor authentication fields.
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "User" ADD COLUMN "twoFactorConfirmedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "twoFactorBackupCodes" TEXT;

ALTER TABLE "AdminUser" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "AdminUser" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "AdminUser" ADD COLUMN "twoFactorConfirmedAt" DATETIME;
ALTER TABLE "AdminUser" ADD COLUMN "twoFactorBackupCodes" TEXT;

ALTER TABLE "SiteSettings" ADD COLUMN "requireAdminTwoFactor" BOOLEAN NOT NULL DEFAULT false;
