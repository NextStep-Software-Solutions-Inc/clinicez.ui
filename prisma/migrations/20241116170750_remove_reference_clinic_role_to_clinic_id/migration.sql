/*
  Warnings:

  - You are about to drop the column `clinicId` on the `ClinicRole` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicRole" DROP CONSTRAINT "ClinicRole_clinicId_fkey";

-- AlterTable
ALTER TABLE "ClinicRole" DROP COLUMN "clinicId";
