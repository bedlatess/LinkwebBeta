-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'global',
    "siteTitle" TEXT NOT NULL DEFAULT 'LinkWeb',
    "seoDescription" TEXT NOT NULL DEFAULT 'Self-hosted link-in-bio platform',
    "registrationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "oauthEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("id", "oauthEnabled", "registrationEnabled", "seoDescription", "siteTitle", "updatedAt") SELECT "id", "oauthEnabled", "registrationEnabled", "seoDescription", "siteTitle", "updatedAt" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
