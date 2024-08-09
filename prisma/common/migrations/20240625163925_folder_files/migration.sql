-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "email" TEXT;

-- CreateTable
CREATE TABLE "Folder" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolderSetting" (
    "id" SERIAL NOT NULL,
    "folderId" INTEGER NOT NULL,
    "scopeOrgId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FolderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "folderId" INTEGER NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileSetting" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FileSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FileType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileTypeAttribute" (
    "id" SERIAL NOT NULL,
    "fileTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "FileTypeAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_userId_name_key" ON "Folder"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FolderSetting_folderId_key" ON "FolderSetting"("folderId");

-- CreateIndex
CREATE UNIQUE INDEX "File_userId_folderId_name_key" ON "File"("userId", "folderId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "FileSetting_fileId_key" ON "FileSetting"("fileId");

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FolderSetting" ADD CONSTRAINT "FolderSetting_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FolderSetting" ADD CONSTRAINT "FolderSetting_scopeOrgId_fkey" FOREIGN KEY ("scopeOrgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "FileType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileSetting" ADD CONSTRAINT "FileSetting_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileTypeAttribute" ADD CONSTRAINT "FileTypeAttribute_fileTypeId_fkey" FOREIGN KEY ("fileTypeId") REFERENCES "FileType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
