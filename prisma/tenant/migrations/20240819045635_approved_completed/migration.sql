/*
  Warnings:

  - You are about to drop the column `approvedAt` on the `AppointmentAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `AppointmentAttribute` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "AppointmentAttribute" DROP COLUMN "approvedAt",
DROP COLUMN "approvedBy",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT;
