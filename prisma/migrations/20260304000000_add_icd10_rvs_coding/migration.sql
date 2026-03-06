-- Add rvsCode to master procedure tables
ALTER TABLE "ImagingProcedure" ADD COLUMN IF NOT EXISTS "rvsCode" TEXT;
ALTER TABLE "LaboratoryProcedure" ADD COLUMN IF NOT EXISTS "rvsCode" TEXT;
ALTER TABLE "HeartStationProcedure" ADD COLUMN IF NOT EXISTS "rvsCode" TEXT;

-- Add rvsCode to clinic procedure tables
ALTER TABLE "ClinicImagingProcedure" ADD COLUMN IF NOT EXISTS "rvsCode" TEXT;
ALTER TABLE "ClinicLaboratoryProcedure" ADD COLUMN IF NOT EXISTS "rvsCode" TEXT;
ALTER TABLE "ClinicHeartStationProcedure" ADD COLUMN IF NOT EXISTS "rvsCode" TEXT;

-- Create ConsultationDiagnosis table for ICD-10 coding
CREATE TABLE IF NOT EXISTS "ConsultationDiagnosis" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "icd10Code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PRIMARY',
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsultationDiagnosis_pkey" PRIMARY KEY ("id")
);

-- Add index on consultationTicketId
CREATE INDEX IF NOT EXISTS "ConsultationDiagnosis_consultationTicketId_idx" ON "ConsultationDiagnosis"("consultationTicketId");

-- Add foreign key constraints
ALTER TABLE "ConsultationDiagnosis" ADD CONSTRAINT "ConsultationDiagnosis_consultationTicketId_fkey"
    FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "ConsultationDiagnosis" ADD CONSTRAINT "ConsultationDiagnosis_hpId_fkey"
    FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
