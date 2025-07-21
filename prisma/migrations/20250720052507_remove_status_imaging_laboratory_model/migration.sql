/*
  Warnings:

  - You are about to drop the column `status` on the `ClinicImagingRequest` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ClinicLaboratoryRequest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicImagingRequest" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "ClinicLaboratoryRequest" DROP COLUMN "status";
