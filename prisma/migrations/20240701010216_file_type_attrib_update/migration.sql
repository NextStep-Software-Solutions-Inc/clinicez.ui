/*
  Warnings:

  - You are about to drop the column `name` on the `FileTypeAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `FileTypeAttribute` table. All the data in the column will be lost.
  - The `validUntil` column on the `FileTypeAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[fileTypeId]` on the table `FileTypeAttribute` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fileTypeId,scopeOrgId]` on the table `FileTypeAttribute` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "FileTypeAttribute" DROP COLUMN "name",
DROP COLUMN "type",
ADD COLUMN     "scopeOrgId" INTEGER,
DROP COLUMN "validUntil",
ADD COLUMN     "validUntil" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "FileTypeAttribute_fileTypeId_key" ON "FileTypeAttribute"("fileTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "FileTypeAttribute_fileTypeId_scopeOrgId_key" ON "FileTypeAttribute"("fileTypeId", "scopeOrgId");

-- AddForeignKey
ALTER TABLE "FileTypeAttribute" ADD CONSTRAINT "FileTypeAttribute_scopeOrgId_fkey" FOREIGN KEY ("scopeOrgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
