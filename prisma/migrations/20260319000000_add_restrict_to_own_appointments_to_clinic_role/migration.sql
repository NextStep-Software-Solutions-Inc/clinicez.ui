-- AlterTable
ALTER TABLE "ClinicRole" ADD COLUMN IF NOT EXISTS "restrictToOwnAppointments" BOOLEAN NOT NULL DEFAULT false;
