/*
  Warnings:

  - You are about to drop the column `caseNumber` on the `PhysicalExamination` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `SequenceGenerator` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[caseNumber]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicImagingRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicLaboratoryRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicMedicalCertificate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicReferralSlip` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[caseNumber]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ekasTransactionNumber]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `Prescription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityType,clinicId,date]` on the table `SequenceGenerator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[caseNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `SequenceGenerator` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "PhysicalExamination_caseNumber_idx";

-- DropIndex
DROP INDEX "SequenceGenerator_clinicId_year_idx";

-- DropIndex
DROP INDEX "SequenceGenerator_entityType_clinicId_year_key";

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "caseNumber" TEXT,
ADD COLUMN     "caseNumberGeneratedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ClinicImagingRequest" ADD COLUMN     "transactionGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "transactionNumber" TEXT;

-- AlterTable
ALTER TABLE "ClinicLaboratoryRequest" ADD COLUMN     "transactionGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "transactionNumber" TEXT;

-- AlterTable
ALTER TABLE "ClinicMedicalCertificate" ADD COLUMN     "transactionGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "transactionNumber" TEXT;

-- AlterTable
ALTER TABLE "ClinicReferralSlip" ADD COLUMN     "transactionGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "transactionNumber" TEXT;

-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "caseNumberGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "ekasAuthorizationCode" TEXT,
ADD COLUMN     "ekasTransactionGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "ekasTransactionNumber" TEXT;

-- AlterTable
ALTER TABLE "PhysicalExamination" DROP COLUMN "caseNumber";

-- AlterTable
ALTER TABLE "Prescription" ADD COLUMN     "transactionGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "transactionNumber" TEXT;

-- AlterTable
ALTER TABLE "SequenceGenerator" DROP COLUMN "year",
ADD COLUMN     "date" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "caseNumber" TEXT,
ADD COLUMN     "caseNumberGeneratedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_caseNumber_key" ON "Appointment"("caseNumber");

-- CreateIndex
CREATE INDEX "Appointment_caseNumber_idx" ON "Appointment"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicImagingRequest_transactionNumber_key" ON "ClinicImagingRequest"("transactionNumber");

-- CreateIndex
CREATE INDEX "ClinicImagingRequest_transactionNumber_idx" ON "ClinicImagingRequest"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLaboratoryRequest_transactionNumber_key" ON "ClinicLaboratoryRequest"("transactionNumber");

-- CreateIndex
CREATE INDEX "ClinicLaboratoryRequest_transactionNumber_idx" ON "ClinicLaboratoryRequest"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicMedicalCertificate_transactionNumber_key" ON "ClinicMedicalCertificate"("transactionNumber");

-- CreateIndex
CREATE INDEX "ClinicMedicalCertificate_transactionNumber_idx" ON "ClinicMedicalCertificate"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicReferralSlip_transactionNumber_key" ON "ClinicReferralSlip"("transactionNumber");

-- CreateIndex
CREATE INDEX "ClinicReferralSlip_transactionNumber_idx" ON "ClinicReferralSlip"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicket_caseNumber_key" ON "ConsultationTicket"("caseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicket_ekasTransactionNumber_key" ON "ConsultationTicket"("ekasTransactionNumber");

-- CreateIndex
CREATE INDEX "ConsultationTicket_ekasTransactionNumber_idx" ON "ConsultationTicket"("ekasTransactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_transactionNumber_key" ON "Prescription"("transactionNumber");

-- CreateIndex
CREATE INDEX "Prescription_transactionNumber_idx" ON "Prescription"("transactionNumber");

-- CreateIndex
CREATE INDEX "SequenceGenerator_clinicId_date_idx" ON "SequenceGenerator"("clinicId", "date");

-- CreateIndex
CREATE INDEX "SequenceGenerator_date_idx" ON "SequenceGenerator"("date");

-- CreateIndex
CREATE UNIQUE INDEX "SequenceGenerator_entityType_clinicId_date_key" ON "SequenceGenerator"("entityType", "clinicId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "User_caseNumber_key" ON "User"("caseNumber");

-- CreateIndex
CREATE INDEX "User_caseNumber_idx" ON "User"("caseNumber");
