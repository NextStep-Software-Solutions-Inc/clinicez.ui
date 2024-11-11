/*
  Warnings:

  - The primary key for the `AppointmentAttribute` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `AppointmentAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `AppointmentRequester` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `requester` on the `AppointmentRequester` table. All the data in the column will be lost.
  - The `id` column on the `AppointmentRequester` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[appointmentId,email]` on the table `AppointmentRequester` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `AppointmentRequester` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "AppointmentRequester_appointmentId_requester_key";

-- AlterTable
ALTER TABLE "AppointmentAttribute" DROP CONSTRAINT "AppointmentAttribute_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "AppointmentAttribute_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "AppointmentRequester" DROP CONSTRAINT "AppointmentRequester_pkey",
DROP COLUMN "requester",
ADD COLUMN     "email" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "AppointmentRequester_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequester_appointmentId_email_key" ON "AppointmentRequester"("appointmentId", "email");
