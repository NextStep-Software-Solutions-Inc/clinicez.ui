/*
  Warnings:

  - Changed the type of `clinicId` on the `ClinicPrescriptionSetting` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clinicId` on the `DocumentTemplate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `clinicId` to the `Medication` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `hpId` on the `Medication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `patientId` on the `Medication` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `hpId` on the `Prescription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clinicId` on the `Prescription` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "ClinicPrescriptionSetting" DROP COLUMN "clinicId",
ADD COLUMN     "clinicId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "DocumentTemplate" DROP COLUMN "clinicId",
ADD COLUMN     "clinicId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "clinicId" INTEGER NOT NULL,
DROP COLUMN "hpId",
ADD COLUMN     "hpId" INTEGER NOT NULL,
DROP COLUMN "patientId",
ADD COLUMN     "patientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Prescription" DROP COLUMN "hpId",
ADD COLUMN     "hpId" INTEGER NOT NULL,
DROP COLUMN "clinicId",
ADD COLUMN     "clinicId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "medication_index" ON "Medication"("patientId", "hpId");

-- CreateIndex
CREATE INDEX "prescription_index" ON "Prescription"("clinicId", "medicationId", "templateId");
