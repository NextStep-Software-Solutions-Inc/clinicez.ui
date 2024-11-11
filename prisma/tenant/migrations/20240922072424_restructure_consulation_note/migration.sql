/*
  Warnings:

  - You are about to drop the column `noteSectionId` on the `ConsultationNote` table. All the data in the column will be lost.
  - You are about to drop the column `noteTemplateId` on the `ConsultationRecordAttribute` table. All the data in the column will be lost.
  - You are about to drop the `NoteSection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NoteTemplate` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[consultationRecordId,section]` on the table `ConsultationNote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `section` to the `ConsultationNote` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ConsultationNote" DROP CONSTRAINT "ConsultationNote_noteSectionId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationRecordAttribute" DROP CONSTRAINT "ConsultationRecordAttribute_noteTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "NoteSection" DROP CONSTRAINT "NoteSection_templateId_fkey";

-- DropIndex
DROP INDEX "ConsultationNote_consultationRecordId_noteSectionId_key";

-- AlterTable
ALTER TABLE "ConsultationNote" DROP COLUMN "noteSectionId",
ADD COLUMN     "section" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ConsultationRecordAttribute" DROP COLUMN "noteTemplateId",
ADD COLUMN     "noteTemplateName" TEXT NOT NULL DEFAULT 'SOAP';

-- DropTable
DROP TABLE "NoteSection";

-- DropTable
DROP TABLE "NoteTemplate";

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNote_consultationRecordId_section_key" ON "ConsultationNote"("consultationRecordId", "section");
