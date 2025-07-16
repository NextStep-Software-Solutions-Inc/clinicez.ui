/*
  Warnings:

  - Added the required column `serialNumber` to the `ClinicMedicalCertificate` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ClinicMedicalCertificate" ADD COLUMN     "serialNumber" TEXT NOT NULL;
