-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
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
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("id", "isMaintenanceMode", "oauthEnabled", "registrationEnabled", "seoDescription", "siteTitle", "updatedAt") SELECT "id", "isMaintenanceMode", "oauthEnabled", "registrationEnabled", "seoDescription", "siteTitle", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
