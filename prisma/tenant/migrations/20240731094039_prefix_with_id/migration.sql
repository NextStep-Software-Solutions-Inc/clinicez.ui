/*
  Warnings:

  - You are about to drop the column `mode` on the `AppointmentAttribute` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `AppointmentAttribute` table. All the data in the column will be lost.
  - Added the required column `modeId` to the `AppointmentAttribute` table without a default value. This is not possible if the table is not empty.
  - Added the required column `typeId` to the `AppointmentAttribute` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "AppointmentAttribute" DROP CONSTRAINT "AppointmentAttribute_mode_fkey";

-- DropForeignKey
ALTER TABLE "AppointmentAttribute" DROP CONSTRAINT "AppointmentAttribute_type_fkey";

-- AlterTable
ALTER TABLE "AppointmentAttribute" DROP COLUMN "mode",
DROP COLUMN "type",
ADD COLUMN     "modeId" INTEGER NOT NULL,
ADD COLUMN     "typeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_modeId_fkey" FOREIGN KEY ("modeId") REFERENCES "AppointmentMode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "AppointmentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
