/*
  Warnings:

  - You are about to drop the column `requirments` on the `AppointmentTypeAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `requirments` on the `ServiceAttribute` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppointmentTypeAttribute" DROP COLUMN "requirments",
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "ServiceAttribute" DROP COLUMN "requirments",
ADD COLUMN     "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[];
