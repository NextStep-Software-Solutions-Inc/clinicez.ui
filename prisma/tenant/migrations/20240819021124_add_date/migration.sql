-- AlterTable
ALTER TABLE "AppointmentAttribute" ADD COLUMN     "date" DATE,
ALTER COLUMN "timeEnd" SET DATA TYPE TIME,
ALTER COLUMN "timeStart" SET DATA TYPE TIME;
