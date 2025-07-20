-- AlterTable
ALTER TABLE "ClinicImagingRequest" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "ClinicLaboratoryRequest" ADD COLUMN     "status" TEXT DEFAULT 'PENDING';
