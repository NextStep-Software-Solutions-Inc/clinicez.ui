/*
  Warnings:

  - You are about to drop the column `daysCount` on the `MedicationDrug` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `MedicationDrug` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MedicationDrug" DROP COLUMN "daysCount",
DROP COLUMN "quantity",
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "frequency" TEXT NOT NULL DEFAULT '';
