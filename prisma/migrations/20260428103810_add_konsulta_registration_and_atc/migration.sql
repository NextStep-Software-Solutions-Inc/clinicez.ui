/*
  Warnings:

  - A unique constraint covering the columns `[konsultaHciCaseNo]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[konsultaHciTransNo]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ClinicPatient" ADD COLUMN     "konsultaEffYear" TEXT,
ADD COLUMN     "konsultaMemberPin" TEXT,
ADD COLUMN     "konsultaPatientType" TEXT,
ADD COLUMN     "konsultaRegisteredAt" TIMESTAMP(3),
ADD COLUMN     "konsultaRegistrationCheckedAt" TIMESTAMP(3),
ADD COLUMN     "konsultaRegistrationResult" JSONB,
ADD COLUMN     "konsultaRegistrationStatus" TEXT,
ADD COLUMN     "konsultaUnenrolledAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "konsultaAtc" TEXT,
ADD COLUMN     "konsultaAtcValidatedAt" TIMESTAMP(3),
ADD COLUMN     "konsultaAtcValidationResult" JSONB,
ADD COLUMN     "konsultaAtcValidationStatus" TEXT,
ADD COLUMN     "konsultaHciCaseNo" TEXT,
ADD COLUMN     "konsultaHciTransNo" TEXT;

-- AlterTable
ALTER TABLE "KonsultaEntry" ADD COLUMN     "hciCaseNo" TEXT,
ADD COLUMN     "hciTransNo" TEXT,
ADD COLUMN     "memberPin" TEXT;

-- CreateIndex
CREATE INDEX "ClinicPatient_clinicId_konsultaEffYear_konsultaRegistration_idx" ON "ClinicPatient"("clinicId", "konsultaEffYear", "konsultaRegistrationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicket_konsultaHciCaseNo_key" ON "ConsultationTicket"("konsultaHciCaseNo");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicket_konsultaHciTransNo_key" ON "ConsultationTicket"("konsultaHciTransNo");

-- CreateIndex
CREATE INDEX "ConsultationTicket_konsultaHciCaseNo_idx" ON "ConsultationTicket"("konsultaHciCaseNo");

-- CreateIndex
CREATE INDEX "ConsultationTicket_konsultaHciTransNo_idx" ON "ConsultationTicket"("konsultaHciTransNo");
