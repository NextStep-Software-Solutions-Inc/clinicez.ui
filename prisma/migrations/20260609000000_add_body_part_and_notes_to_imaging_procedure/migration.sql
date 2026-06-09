-- AlterTable: add bodyPart and notes columns to ClinicImagingRequestProcedure
ALTER TABLE "ClinicImagingRequestProcedure" ADD COLUMN IF NOT EXISTS "bodyPart" TEXT;
ALTER TABLE "ClinicImagingRequestProcedure" ADD COLUMN IF NOT EXISTS "notes" TEXT;
