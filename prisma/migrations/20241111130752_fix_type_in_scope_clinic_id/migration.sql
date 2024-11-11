/*
  Warnings:

  - You are about to drop the column `scopeClincId` on the `FileTypeAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `scopeClincId` on the `FolderSetting` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[fileTypeId,scopeClinicId]` on the table `FileTypeAttribute` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "FileTypeAttribute" DROP CONSTRAINT "FileTypeAttribute_scopeClincId_fkey";

-- DropForeignKey
ALTER TABLE "FolderSetting" DROP CONSTRAINT "FolderSetting_scopeClincId_fkey";

-- DropIndex
DROP INDEX "FileTypeAttribute_fileTypeId_scopeClincId_key";

-- AlterTable
ALTER TABLE "FileTypeAttribute" DROP COLUMN "scopeClincId",
ADD COLUMN     "scopeClinicId" INTEGER;

-- AlterTable
ALTER TABLE "FolderSetting" DROP COLUMN "scopeClincId",
ADD COLUMN     "scopeClinicId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "FileTypeAttribute_fileTypeId_scopeClinicId_key" ON "FileTypeAttribute"("fileTypeId", "scopeClinicId");

-- AddForeignKey
ALTER TABLE "FolderSetting" ADD CONSTRAINT "FolderSetting_scopeClinicId_fkey" FOREIGN KEY ("scopeClinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "FileTypeAttribute" ADD CONSTRAINT "FileTypeAttribute_scopeClinicId_fkey" FOREIGN KEY ("scopeClinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
