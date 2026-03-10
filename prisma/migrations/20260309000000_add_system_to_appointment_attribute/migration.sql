-- Make ConsultationTicket.systemId optional (nullable)
ALTER TABLE "ConsultationTicket" ALTER COLUMN "systemId" DROP NOT NULL;

-- Add systemId (optional) to AppointmentAttribute
ALTER TABLE "AppointmentAttribute" ADD COLUMN "systemId" INTEGER;

-- Add foreign key constraint
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES "System"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
