/*
  Warnings:

  - You are about to drop the `ProcedureUsageHistory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProcedureUsageHistory" DROP CONSTRAINT "ProcedureUsageHistory_clinicId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedureUsageHistory" DROP CONSTRAINT "ProcedureUsageHistory_clinicPatientId_fkey";

-- DropForeignKey
ALTER TABLE "ProcedureUsageHistory" DROP CONSTRAINT "ProcedureUsageHistory_userId_fkey";

-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "konsultaRecommendedDiagnosticOptions" JSONB;

-- DropTable
DROP TABLE "ProcedureUsageHistory";

-- CreateTable
CREATE TABLE "KonsultaRecommendedService" (
    "id" TEXT NOT NULL,
    "minAgeMonths" INTEGER,
    "maxAgeMonths" INTEGER,
    "gender" "Gender",
    "consultationDescription" TEXT NOT NULL,
    "philhealthDiagnosticIds" TEXT[],

    CONSTRAINT "KonsultaRecommendedService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticProcedure" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "philhealthDiagnosticId" TEXT,

    CONSTRAINT "DiagnosticProcedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticRequest" (
    "id" TEXT NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "patientId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER,
    "documentTemplateId" INTEGER NOT NULL,
    "remarks" TEXT,
    "dateRequested" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "diagnosticProcedures" JSONB NOT NULL,

    CONSTRAINT "DiagnosticRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticProcedure_name_category_key" ON "DiagnosticProcedure"("name", "category");

-- AddForeignKey
ALTER TABLE "DiagnosticRequest" ADD CONSTRAINT "DiagnosticRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRequest" ADD CONSTRAINT "DiagnosticRequest_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRequest" ADD CONSTRAINT "DiagnosticRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRequest" ADD CONSTRAINT "DiagnosticRequest_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticRequest" ADD CONSTRAINT "DiagnosticRequest_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
