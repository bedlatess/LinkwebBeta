-- AlterTable
ALTER TABLE "User" ADD COLUMN "customDomain" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ThemeConfig" (
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ThemeConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ThemeConfig" ("bgBlur", "bgType", "bgValue", "buttonStyle", "customCSS", "fontFamily", "id", "updatedAt", "userId") SELECT "bgBlur", "bgType", "bgValue", "buttonStyle", "customCSS", "fontFamily", "id", "updatedAt", "userId" FROM "ThemeConfig";
DROP TABLE "ThemeConfig";
ALTER TABLE "new_ThemeConfig" RENAME TO "ThemeConfig";
CREATE UNIQUE INDEX "ThemeConfig_userId_key" ON "ThemeConfig"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_customDomain_key" ON "User"("customDomain");
