-- AlterTable
-- Add PhilHealth Accreditation Number and Facility Name to ClinicSetting
ALTER TABLE "ClinicSetting" ADD COLUMN IF NOT EXISTS "philhealthAccreditationNumber" TEXT;
ALTER TABLE "ClinicSetting" ADD COLUMN IF NOT EXISTS "facilityName" TEXT;
