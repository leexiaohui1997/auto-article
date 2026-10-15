-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ShareLinkFolder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "parentId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "ShareLinkFolder_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShareLinkFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ShareLinkFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ShareLinkFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "linkId" TEXT NOT NULL,
    "folderId" TEXT,
    "url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "ext" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    CONSTRAINT "ShareLinkFile_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "ShareLink" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ShareLinkFile_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "ShareLinkFolder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score" DECIMAL NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneAt" DATETIME,
    "processingAt" DATETIME
);
