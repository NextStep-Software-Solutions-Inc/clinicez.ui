/*
  Warnings:

  - You are about to drop the `PediatricMeasurement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PhysicalExamination` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PediatricMeasurement" DROP CONSTRAINT "PediatricMeasurement_userId_fkey";

-- DropForeignKey
ALTER TABLE "PhysicalExamination" DROP CONSTRAINT "PhysicalExamination_userId_fkey";

-- DropForeignKey
ALTER TABLE "PhysicalExamination" DROP CONSTRAINT "PhysicalExamination_vitalSignId_fkey";

-- AlterTable
ALTER TABLE "ConsultationNote" ADD COLUMN     "structuredData" JSONB;

-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "isPhilHealthKonsulta" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "konsultaAtcCode" TEXT,
ADD COLUMN     "konsultaCoPay" DECIMAL(10,2),
ADD COLUMN     "konsultaIsWalkedIn" BOOLEAN;

-- AlterTable
ALTER TABLE "PhilHealthKonsultaEnlistment" ADD COLUMN     "atcCode" TEXT,
ADD COLUMN     "isWalkedIn" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VitalSign" ADD COLUMN     "headCircumference" DECIMAL(5,2),
ADD COLUMN     "hipCircumference" DECIMAL(5,2),
ADD COLUMN     "length" DECIMAL(5,2),
ADD COLUMN     "limbCircumference" DECIMAL(5,2),
ADD COLUMN     "midUpperArmCircumference" DECIMAL(5,2),
ADD COLUMN     "skinfoldThickness" DECIMAL(5,2),
ADD COLUMN     "visualAcuityLeft" TEXT,
ADD COLUMN     "visualAcuityRight" TEXT,
ADD COLUMN     "waistCircumference" DECIMAL(5,2),
ADD COLUMN     "zScore" DOUBLE PRECISION;

-- DropTable
DROP TABLE "PediatricMeasurement";

-- DropTable
DROP TABLE "PhysicalExamination";

-- CreateTable
CREATE TABLE "MedicinePhilHealthData" (
    "id" TEXT NOT NULL,
    "medicineId" INTEGER NOT NULL,
    "category" TEXT,
    "drugCode" TEXT,
    "genericCode" TEXT,
    "saltCode" TEXT,
    "strengthCode" TEXT,
    "formCode" TEXT,
    "unitCode" TEXT,
    "packageCode" TEXT,
    "otherMedicine" TEXT,
    "othMedDrugGrouping" TEXT,
    "route" TEXT,
    "actualUnitPrice" DECIMAL(10,2),
    "totalAmtPrice" DECIMAL(10,2),
    "instructionQuantity" TEXT,
    "instructionStrength" TEXT,
    "instructionFrequency" TEXT,
    "isApplicable" TEXT DEFAULT 'Y',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicinePhilHealthData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaDiagnosticResult" (
    "id" TEXT NOT NULL,
    "consultationTicketId" INTEGER,
    "clinicPatientId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "hciCaseNo" TEXT NOT NULL,
    "hciTransNo" TEXT NOT NULL,
    "resultType" TEXT NOT NULL,
    "resultData" JSONB NOT NULL,
    "transDate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaDiagnosticResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicinePhilHealthData_medicineId_key" ON "MedicinePhilHealthData"("medicineId");

-- CreateIndex
CREATE INDEX "KonsultaDiagnosticResult_hciCaseNo_idx" ON "KonsultaDiagnosticResult"("hciCaseNo");

-- CreateIndex
CREATE INDEX "KonsultaDiagnosticResult_consultationTicketId_idx" ON "KonsultaDiagnosticResult"("consultationTicketId");

-- AddForeignKey
ALTER TABLE "MedicinePhilHealthData" ADD CONSTRAINT "MedicinePhilHealthData_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaDiagnosticResult" ADD CONSTRAINT "KonsultaDiagnosticResult_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
