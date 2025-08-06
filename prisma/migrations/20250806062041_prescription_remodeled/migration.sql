/*
  Warnings:

  - You are about to drop the column `medicationId` on the `Prescription` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[serialNumber]` on the table `Prescription` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Prescription" DROP CONSTRAINT "Prescription_medicationId_fkey";

-- DropIndex
DROP INDEX "prescription_index";

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "medicationId",
ADD COLUMN     "consultationTicketId" INTEGER,
ADD COLUMN     "createdById" INTEGER,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "patientId" INTEGER,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "serialNumber" TEXT,
ADD COLUMN     "updatedBy" INTEGER,
ALTER COLUMN "clinicId" DROP NOT NULL,
ALTER COLUMN "hpId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Medicine" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT,
    "genericName" TEXT,
    "isGeneric" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "dosage" TEXT,
    "frequency" TEXT,
    "unit" TEXT,
    "notes" TEXT,
    "prescriptionId" INTEGER,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicine_prescription_index" ON "Medicine"("prescriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_serialNumber_key" ON "Prescription"("serialNumber");

-- CreateIndex
CREATE INDEX "prescription_index" ON "Prescription"("clinicId", "patientId", "hpId", "consultationTicketId");

-- CreateIndex
CREATE INDEX "prescription_template_index" ON "Prescription"("templateId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
