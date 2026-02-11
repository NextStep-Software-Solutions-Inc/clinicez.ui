-- AlterTable
ALTER TABLE "ClinicSetting" ADD COLUMN IF NOT EXISTS "philhealthAccreditationNumber" TEXT,
ADD COLUMN IF NOT EXISTS "facilityName" TEXT;
