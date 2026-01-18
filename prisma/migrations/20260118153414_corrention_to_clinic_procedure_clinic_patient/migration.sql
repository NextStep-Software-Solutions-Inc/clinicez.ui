/*
  Warnings:

  - You are about to drop the column `clinicPatientId` on the `ClinicHeartStationProcedure` table. All the data in the column will be lost.
  - You are about to drop the column `clinicPatientId` on the `ClinicImagingProcedure` table. All the data in the column will be lost.
  - You are about to drop the column `clinicPatientId` on the `ClinicLaboratoryProcedure` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicHeartStationProcedure" DROP CONSTRAINT "ClinicHeartStationProcedure_clinicPatientId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicImagingProcedure" DROP CONSTRAINT "ClinicImagingProcedure_clinicPatientId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicLaboratoryProcedure" DROP CONSTRAINT "ClinicLaboratoryProcedure_clinicPatientId_fkey";

-- AlterTable
ALTER TABLE "ClinicHeartStationProcedure" DROP COLUMN "clinicPatientId",
ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "ClinicImagingProcedure" DROP COLUMN "clinicPatientId",
ADD COLUMN     "category" TEXT;

-- AlterTable
ALTER TABLE "ClinicLaboratoryProcedure" DROP COLUMN "clinicPatientId",
ADD COLUMN     "category" TEXT;
