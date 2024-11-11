/*
  Warnings:

  - The `receivedBy` column on the `AppointmentAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `rejectedBy` column on the `AppointmentAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `completedBy` column on the `AppointmentAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `rescheduledBy` column on the `AppointmentAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `preferredAppointee` column on the `AppointmentAttribute` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AppointmentAttribute" DROP COLUMN "receivedBy",
ADD COLUMN     "receivedBy" INTEGER,
DROP COLUMN "rejectedBy",
ADD COLUMN     "rejectedBy" INTEGER,
DROP COLUMN "completedBy",
ADD COLUMN     "completedBy" INTEGER,
DROP COLUMN "rescheduledBy",
ADD COLUMN     "rescheduledBy" INTEGER,
DROP COLUMN "preferredAppointee",
ADD COLUMN     "preferredAppointee" INTEGER;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_preferredAppointee_fkey" FOREIGN KEY ("preferredAppointee") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_rejectedBy_fkey" FOREIGN KEY ("rejectedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
