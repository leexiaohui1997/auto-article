/*
  Warnings:

  - Added the required column `sopResult` to the `Book` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" DECIMAL NOT NULL,
    "reason" TEXT NOT NULL,
    "sopResult" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" DATETIME,
    "processingAt" DATETIME,
    CONSTRAINT "Book_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "ShareLinkFile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Book" ("createdAt", "doneAt", "fileId", "id", "name", "processingAt", "reason", "score", "status") SELECT "createdAt", "doneAt", "fileId", "id", "name", "processingAt", "reason", "score", "status" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
