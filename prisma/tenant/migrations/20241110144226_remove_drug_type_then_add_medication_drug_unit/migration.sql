/*
  Warnings:

  - You are about to drop the column `type` on the `Drug` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Drug" DROP COLUMN "type";

-- AlterTable
ALTER TABLE "MedicationDrug" ADD COLUMN     "unit" TEXT;
