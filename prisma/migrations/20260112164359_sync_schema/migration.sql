/*
  Warnings:

  - You are about to drop the `ClinicImagingRequestDiagnostic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClinicLaboratoryRequestDiagnostic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ImagingDiagnostic` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LaboratoryDiagnostic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicImagingRequestDiagnostic" DROP CONSTRAINT "ClinicImagingRequestDiagnostic_clinicImagingRequestId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicImagingRequestDiagnostic" DROP CONSTRAINT "ClinicImagingRequestDiagnostic_imagingDiagnosticId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicLaboratoryRequestDiagnostic" DROP CONSTRAINT "ClinicLaboratoryRequestDiagnostic_clinicLaboratoryRequestI_fkey";

-- DropForeignKey
ALTER TABLE "ClinicLaboratoryRequestDiagnostic" DROP CONSTRAINT "ClinicLaboratoryRequestDiagnostic_laboratoryDiagnosticId_fkey";

-- DropIndex
DROP INDEX "ClinicLaboratoryRequest_transactionNumber_idx";

-- DropTable
DROP TABLE "ClinicImagingRequestDiagnostic";

-- DropTable
DROP TABLE "ClinicLaboratoryRequestDiagnostic";

-- DropTable
DROP TABLE "ImagingDiagnostic";

-- DropTable
DROP TABLE "LaboratoryDiagnostic";

-- CreateTable
CREATE TABLE "ImagingProcedure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImagingProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryProcedure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaboratoryProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeartStationProcedure" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeartStationProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicImagingProcedure" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "masterProcedureId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicPatientId" INTEGER,

    CONSTRAINT "ClinicImagingProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicLaboratoryProcedure" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "masterProcedureId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicPatientId" INTEGER,

    CONSTRAINT "ClinicLaboratoryProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicHeartStationProcedure" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "masterProcedureId" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clinicPatientId" INTEGER,

    CONSTRAINT "ClinicHeartStationProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcedureUsageHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "procedureType" TEXT NOT NULL,
    "procedureId" INTEGER NOT NULL,
    "procedureName" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clinicPatientId" INTEGER,

    CONSTRAINT "ProcedureUsageHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicHeartStationRequest" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "history" TEXT,
    "impression" TEXT,
    "reason" TEXT,
    "updatedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "serialNumber" TEXT NOT NULL,
    "transactionNumber" TEXT,
    "transactionGeneratedAt" TIMESTAMP(3),
    "consultationTicketId" INTEGER NOT NULL,

    CONSTRAINT "ClinicHeartStationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicLaboratoryRequestProcedure" (
    "id" SERIAL NOT NULL,
    "clinicLaboratoryRequestId" INTEGER NOT NULL,
    "clinicLaboratoryProcedureId" INTEGER NOT NULL,

    CONSTRAINT "ClinicLaboratoryRequestProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicImagingRequestProcedure" (
    "id" SERIAL NOT NULL,
    "clinicImagingRequestId" INTEGER NOT NULL,
    "clinicImagingProcedureId" INTEGER NOT NULL,

    CONSTRAINT "ClinicImagingRequestProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicHeartStationRequestProcedure" (
    "id" SERIAL NOT NULL,
    "clinicHeartStationRequestId" INTEGER NOT NULL,
    "clinicHeartStationProcedureId" INTEGER NOT NULL,

    CONSTRAINT "ClinicHeartStationRequestProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImagingProcedure_name_category_key" ON "ImagingProcedure"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratoryProcedure_name_category_key" ON "LaboratoryProcedure"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "HeartStationProcedure_name_category_key" ON "HeartStationProcedure"("name", "category");

-- CreateIndex
CREATE INDEX "ClinicImagingProcedure_clinicId_idx" ON "ClinicImagingProcedure"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicImagingProcedure_clinicId_name_key" ON "ClinicImagingProcedure"("clinicId", "name");

-- CreateIndex
CREATE INDEX "ClinicLaboratoryProcedure_clinicId_idx" ON "ClinicLaboratoryProcedure"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLaboratoryProcedure_clinicId_name_key" ON "ClinicLaboratoryProcedure"("clinicId", "name");

-- CreateIndex
CREATE INDEX "ClinicHeartStationProcedure_clinicId_idx" ON "ClinicHeartStationProcedure"("clinicId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicHeartStationProcedure_clinicId_name_key" ON "ClinicHeartStationProcedure"("clinicId", "name");

-- CreateIndex
CREATE INDEX "ProcedureUsageHistory_userId_clinicId_procedureType_idx" ON "ProcedureUsageHistory"("userId", "clinicId", "procedureType");

-- CreateIndex
CREATE INDEX "ProcedureUsageHistory_usedAt_idx" ON "ProcedureUsageHistory"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicHeartStationRequest_serialNumber_key" ON "ClinicHeartStationRequest"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicHeartStationRequest_transactionNumber_key" ON "ClinicHeartStationRequest"("transactionNumber");

-- CreateIndex
CREATE INDEX "ClinicHeartStationRequest_transactionNumber_idx" ON "ClinicHeartStationRequest"("transactionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLaboratoryRequestProcedure_clinicLaboratoryRequestId__key" ON "ClinicLaboratoryRequestProcedure"("clinicLaboratoryRequestId", "clinicLaboratoryProcedureId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicImagingRequestProcedure_clinicImagingRequestId_clinic_key" ON "ClinicImagingRequestProcedure"("clinicImagingRequestId", "clinicImagingProcedureId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicHeartStationRequestProcedure_clinicHeartStationReques_key" ON "ClinicHeartStationRequestProcedure"("clinicHeartStationRequestId", "clinicHeartStationProcedureId");

-- AddForeignKey
ALTER TABLE "ClinicImagingProcedure" ADD CONSTRAINT "ClinicImagingProcedure_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingProcedure" ADD CONSTRAINT "ClinicImagingProcedure_masterProcedureId_fkey" FOREIGN KEY ("masterProcedureId") REFERENCES "ImagingProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingProcedure" ADD CONSTRAINT "ClinicImagingProcedure_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryProcedure" ADD CONSTRAINT "ClinicLaboratoryProcedure_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryProcedure" ADD CONSTRAINT "ClinicLaboratoryProcedure_masterProcedureId_fkey" FOREIGN KEY ("masterProcedureId") REFERENCES "LaboratoryProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryProcedure" ADD CONSTRAINT "ClinicLaboratoryProcedure_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationProcedure" ADD CONSTRAINT "ClinicHeartStationProcedure_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationProcedure" ADD CONSTRAINT "ClinicHeartStationProcedure_masterProcedureId_fkey" FOREIGN KEY ("masterProcedureId") REFERENCES "HeartStationProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationProcedure" ADD CONSTRAINT "ClinicHeartStationProcedure_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProcedureUsageHistory" ADD CONSTRAINT "ProcedureUsageHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProcedureUsageHistory" ADD CONSTRAINT "ProcedureUsageHistory_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProcedureUsageHistory" ADD CONSTRAINT "ProcedureUsageHistory_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequest" ADD CONSTRAINT "ClinicHeartStationRequest_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequestProcedure" ADD CONSTRAINT "ClinicLaboratoryRequestProcedure_clinicLaboratoryRequestId_fkey" FOREIGN KEY ("clinicLaboratoryRequestId") REFERENCES "ClinicLaboratoryRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequestProcedure" ADD CONSTRAINT "ClinicLaboratoryRequestProcedure_clinicLaboratoryProcedure_fkey" FOREIGN KEY ("clinicLaboratoryProcedureId") REFERENCES "ClinicLaboratoryProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequestProcedure" ADD CONSTRAINT "ClinicImagingRequestProcedure_clinicImagingRequestId_fkey" FOREIGN KEY ("clinicImagingRequestId") REFERENCES "ClinicImagingRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequestProcedure" ADD CONSTRAINT "ClinicImagingRequestProcedure_clinicImagingProcedureId_fkey" FOREIGN KEY ("clinicImagingProcedureId") REFERENCES "ClinicImagingProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequestProcedure" ADD CONSTRAINT "ClinicHeartStationRequestProcedure_clinicHeartStationReque_fkey" FOREIGN KEY ("clinicHeartStationRequestId") REFERENCES "ClinicHeartStationRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicHeartStationRequestProcedure" ADD CONSTRAINT "ClinicHeartStationRequestProcedure_clinicHeartStationProce_fkey" FOREIGN KEY ("clinicHeartStationProcedureId") REFERENCES "ClinicHeartStationProcedure"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
