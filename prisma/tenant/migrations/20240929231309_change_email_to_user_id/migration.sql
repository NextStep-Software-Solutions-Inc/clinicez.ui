/*
  Warnings:

  - You are about to drop the column `email` on the `AppointmentRequester` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appointmentId,userId]` on the table `AppointmentRequester` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "AppointmentRequester_appointmentId_email_key";

-- AlterTable
ALTER TABLE "AppointmentRequester" DROP COLUMN "email",
ADD COLUMN     "userId" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequester_appointmentId_userId_key" ON "AppointmentRequester"("appointmentId", "userId");
