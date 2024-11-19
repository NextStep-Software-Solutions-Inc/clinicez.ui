/*
  Warnings:

  - You are about to drop the column `lastPerClientIntervalReses` on the `OrgAppointmentConfig` table. All the data in the column will be lost.
  - You are about to drop the column `NoteTemplateId` on the `OrgConsultationConfig` table. All the data in the column will be lost.
  - Added the required column `noteTemplateId` to the `OrgConsultationConfig` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrgConsultationConfig" DROP CONSTRAINT "OrgConsultationConfig_NoteTemplateId_fkey";

-- AlterTable
ALTER TABLE "OrgAppointmentConfig" DROP COLUMN "lastPerClientIntervalReses",
ADD COLUMN     "lastPerClientIntervalReset" DATE;

-- AlterTable
ALTER TABLE "OrgConsultationConfig" DROP COLUMN "NoteTemplateId",
ADD COLUMN     "noteTemplateId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "OrgConsultationConfig" ADD CONSTRAINT "OrgConsultationConfig_noteTemplateId_fkey" FOREIGN KEY ("noteTemplateId") REFERENCES "NoteTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
