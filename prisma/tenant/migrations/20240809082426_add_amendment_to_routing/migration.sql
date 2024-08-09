-- AlterTable
ALTER TABLE "AppointmentRouting" ADD COLUMN     "amendedAt" TIMESTAMP(3),
ADD COLUMN     "amendedBy" TEXT,
ADD COLUMN     "amendment" TEXT;
