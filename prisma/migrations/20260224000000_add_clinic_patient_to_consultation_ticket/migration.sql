-- Add clinicPatientId to ConsultationTicket so that consultations created
-- without a linked appointment can still be associated with a patient.
ALTER TABLE "ConsultationTicket" ADD COLUMN IF NOT EXISTS "clinicPatientId" INTEGER;

ALTER TABLE "ConsultationTicket"
  ADD CONSTRAINT "ConsultationTicket_clinicPatientId_fkey"
  FOREIGN KEY ("clinicPatientId")
  REFERENCES "ClinicPatient"("id")
  ON DELETE NO ACTION ON UPDATE NO ACTION
  NOT VALID;

CREATE INDEX IF NOT EXISTS "ConsultationTicket_clinicPatientId_idx"
  ON "ConsultationTicket"("clinicPatientId");
