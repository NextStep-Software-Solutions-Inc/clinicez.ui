/*
  Warnings:

  - You are about to drop the column `consultationRecordId` on the `ConsultationNote` table. All the data in the column will be lost.
  - You are about to drop the column `consultationRecordId` on the `Intervention` table. All the data in the column will be lost.
  - You are about to drop the `ConsultationRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ConsultationRecordAttribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PreConsultationNote` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[consultationTicketId,section]` on the table `ConsultationNote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `consultationTicketId` to the `ConsultationNote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `consultationTicketId` to the `Intervention` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ConsultationNote" DROP CONSTRAINT "ConsultationNote_consultationRecordId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationRecord" DROP CONSTRAINT "ConsultationRecord_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "ConsultationRecordAttribute" DROP CONSTRAINT "ConsultationRecordAttribute_consultationRecordId_fkey";

-- DropForeignKey
ALTER TABLE "Intervention" DROP CONSTRAINT "Intervention_consultationRecordId_fkey";

-- DropForeignKey
ALTER TABLE "PreConsultationNote" DROP CONSTRAINT "PreConsultationNote_appointmentId_fkey";

-- DropForeignKey
ALTER TABLE "PreConsultationNoteAttribute" DROP CONSTRAINT "PreConsultationNoteAttribute_preConsultationNoteId_fkey";

-- DropIndex
DROP INDEX "ConsultationNote_consultationRecordId_section_key";

-- AlterTable
ALTER TABLE "AppointmentAttribute" ADD COLUMN     "rescheduledAt" TIMESTAMP(3),
ADD COLUMN     "rescheduledBy" TEXT,
ADD COLUMN     "rescheduledReason" TEXT;

-- AlterTable
ALTER TABLE "ConsultationNote" DROP COLUMN "consultationRecordId",
ADD COLUMN     "consultationTicketId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Intervention" DROP COLUMN "consultationRecordId",
ADD COLUMN     "consultationTicketId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "ConsultationRecord";

-- DropTable
DROP TABLE "ConsultationRecordAttribute";

-- DropTable
DROP TABLE "PreConsultationNote";

-- CreateTable
CREATE TABLE "ConsultationTicket" (
    "id" SERIAL NOT NULL,
    "systemId" INTEGER NOT NULL,
    "appointmentId" INTEGER,
    "orgUid" TEXT NOT NULL,
    "subject" TEXT DEFAULT '',
    "hpId" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ConsultationTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationTicketAttribute" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "noteTemplateName" TEXT NOT NULL DEFAULT 'SOAP',
    "whitelistEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "ConsultationTicketAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "System" (
    "id" SERIAL NOT NULL,
    "orgUid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "System_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreAssessmentNote" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "orgUid" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "homeInstructions" TEXT,
    "remarks" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreAssessmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicketAttribute_consultationTicketId_key" ON "ConsultationTicketAttribute"("consultationTicketId");

-- CreateIndex
CREATE UNIQUE INDEX "PreAssessmentNote_appointmentId_createdBy_key" ON "PreAssessmentNote"("appointmentId", "createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationNote_consultationTicketId_section_key" ON "ConsultationNote"("consultationTicketId", "section");

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationTicket" ADD CONSTRAINT "ConsultationTicket_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultationNote" ADD CONSTRAINT "ConsultationNote_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreConsultationNoteAttribute" ADD CONSTRAINT "PreConsultationNoteAttribute_preConsultationNoteId_fkey" FOREIGN KEY ("preConsultationNoteId") REFERENCES "PreAssessmentNote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
