/*
  Warnings:

  - You are about to drop the column `orgUid` on the `ClinicPrescriptionSetting` table. All the data in the column will be lost.
  - You are about to drop the column `generic` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Drug` table. All the data in the column will be lost.
  - You are about to drop the column `dosage` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `drugId` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `prescriptionId` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Medication` table. All the data in the column will be lost.
  - You are about to drop the column `patientId` on the `Prescription` table. All the data in the column will be lost.
  - Added the required column `clinicId` to the `ClinicPrescriptionSetting` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `DocumentTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brandName` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `genericName` to the `Drug` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hpId` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `patientId` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clinicId` to the `Prescription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `medicationId` to the `Prescription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_drugId_fkey";

-- DropForeignKey
ALTER TABLE "Medication" DROP CONSTRAINT "Medication_prescriptionId_fkey";

-- DropIndex
DROP INDEX "prescriptionId";

-- DropIndex
DROP INDEX "patientId";

-- AlterTable
ALTER TABLE "ClinicPrescriptionSetting" DROP COLUMN "orgUid",
ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "DocumentTemplate" ADD COLUMN     "clinicId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Drug" DROP COLUMN "generic",
DROP COLUMN "name",
ADD COLUMN     "brandName" TEXT NOT NULL,
ADD COLUMN     "genericName" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Medication" DROP COLUMN "dosage",
DROP COLUMN "drugId",
DROP COLUMN "notes",
DROP COLUMN "prescriptionId",
DROP COLUMN "quantity",
ADD COLUMN     "hpId" TEXT NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "patientId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "patientId",
ADD COLUMN     "clinicId" TEXT NOT NULL,
ADD COLUMN     "medicationId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "MedicationDrug" (
    "id" SERIAL NOT NULL,
    "medicationId" INTEGER NOT NULL,
    "drugId" INTEGER NOT NULL,
    "isGeneric" BOOLEAN NOT NULL DEFAULT false,
    "dosage" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "daysCount" INTEGER,

    CONSTRAINT "MedicationDrug_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medication_index" ON "Medication"("patientId", "hpId");

-- CreateIndex
CREATE INDEX "prescription_index" ON "Prescription"("clinicId", "medicationId", "templateId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_drugId_fkey" FOREIGN KEY ("drugId") REFERENCES "Drug"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationDrug" ADD CONSTRAINT "MedicationDrug_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
