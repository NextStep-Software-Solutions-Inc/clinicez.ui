/*
  Warnings:

  - The primary key for the `Appointment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `description` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `end` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `requester` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `start` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Appointment` table. All the data in the column will be lost.
  - The `id` column on the `Appointment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `AppointmentInvitee` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orgUid` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject` to the `Appointment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_pkey",
DROP COLUMN "description",
DROP COLUMN "end",
DROP COLUMN "requester",
DROP COLUMN "start",
DROP COLUMN "status",
DROP COLUMN "tenantId",
DROP COLUMN "title",
ADD COLUMN     "complaint" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orgUid" INTEGER NOT NULL,
ADD COLUMN     "subject" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "AppointmentInvitee";

-- CreateTable
CREATE TABLE "AppointmentRequester" (
    "id" TEXT NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "requester" TEXT NOT NULL,

    CONSTRAINT "AppointmentRequester_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAttribute" (
    "id" TEXT NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "maxDuration" INTEGER NOT NULL DEFAULT 30,
    "mode" INTEGER NOT NULL,
    "type" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "serviceId" INTEGER,
    "preferredAppointee" TEXT,

    CONSTRAINT "AppointmentAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentType" (
    "id" SERIAL NOT NULL,
    "orgUid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentMode" (
    "id" SERIAL NOT NULL,
    "orgUid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "AppointmentMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentRouting" (
    "id" SERIAL NOT NULL,
    "routingCode" TEXT NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "routedBy" TEXT NOT NULL,
    "routedTo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" SERIAL NOT NULL,
    "orgUid" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRequester_appointmentId_requester_key" ON "AppointmentRequester"("appointmentId", "requester");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAttribute_appointmentId_key" ON "AppointmentAttribute"("appointmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRouting_routingCode_key" ON "AppointmentRouting"("routingCode");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentRouting_appointmentId_routedTo_key" ON "AppointmentRouting"("appointmentId", "routedTo");

-- AddForeignKey
ALTER TABLE "AppointmentRequester" ADD CONSTRAINT "AppointmentRequester_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_mode_fkey" FOREIGN KEY ("mode") REFERENCES "AppointmentMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_type_fkey" FOREIGN KEY ("type") REFERENCES "AppointmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentRouting" ADD CONSTRAINT "AppointmentRouting_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
