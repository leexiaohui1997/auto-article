-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ShareLinkFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "folderId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "ext" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareLinkFile_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShareLinkFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ShareLinkFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShareLinkFile" ("ext", "folderId", "id", "linkId", "name", "size", "status", "url") SELECT "ext", "folderId", "id", "linkId", "name", "size", "status", "url" FROM "ShareLinkFile";
DROP TABLE "ShareLinkFile";
ALTER TABLE "new_ShareLinkFile" RENAME TO "ShareLinkFile";
CREATE TABLE "new_ShareLinkFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "parentId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ShareLinkFolder_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShareLinkFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ShareLinkFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ShareLinkFolder" ("count", "id", "linkId", "name", "parentId", "status", "url") SELECT "count", "id", "linkId", "name", "parentId", "status", "url" FROM "ShareLinkFolder";
DROP TABLE "ShareLinkFolder";
ALTER TABLE "new_ShareLinkFolder" RENAME TO "ShareLinkFolder";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
