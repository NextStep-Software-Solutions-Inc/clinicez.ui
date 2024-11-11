/*
  Warnings:

  - You are about to drop the column `template` on the `ConsultationRecordAttribute` table. All the data in the column will be lost.
  - You are about to drop the `NoteContent` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `noteTemplateId` to the `ConsultationRecordAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "NoteContent" DROP CONSTRAINT "NoteContent_consultationRecordId_fkey";

-- AlterTable
ALTER TABLE "ConsultationRecordAttribute" DROP COLUMN "template",
ADD COLUMN     "noteTemplateId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'OPEN';

-- DropTable
DROP TABLE "NoteContent";

-- CreateTable
CREATE TABLE "NoteTemplate" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NoteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteSection" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "NoteSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationNote" (
    "id" SERIAL NOT NULL,
    "consultationRecordId" INTEGER NOT NULL,
    "noteSectionId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NoteTemplate_name_key" ON "NoteTemplate"("name");

-- CreateIndex
CREATE UNIQUE INDEX "NoteSection_templateId_name_key" ON "NoteSection"("templateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNote_consultationRecordId_noteSectionId_key" ON "ConsultationNote"("consultationRecordId", "noteSectionId");

-- AddForeignKey
ALTER TABLE "ConsultationRecordAttribute" ADD CONSTRAINT "ConsultationRecordAttribute_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoteSection" ADD CONSTRAINT "NoteSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "NoteTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_noteSectionId_fkey" FOREIGN KEY ("noteSectionId") REFERENCES "NoteSection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_consultationRecordId_fkey" FOREIGN KEY ("consultationRecordId") REFERENCES "ConsultationRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
