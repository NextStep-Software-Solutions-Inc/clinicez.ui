-- AddColumn: droppedAt, droppedBy, dropReason to AppointmentAttribute
ALTER TABLE "AppointmentAttribute" ADD COLUMN IF NOT EXISTS "droppedAt" TIMESTAMP(3);
ALTER TABLE "AppointmentAttribute" ADD COLUMN IF NOT EXISTS "droppedBy" INTEGER;
ALTER TABLE "AppointmentAttribute" ADD COLUMN IF NOT EXISTS "dropReason" TEXT;

-- AddForeignKey: AppointmentAttribute.droppedBy -> User.id
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_droppedBy_fkey"
  FOREIGN KEY ("droppedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddColumn: droppedAt, droppedBy, dropReason to ConsultationTicketAttribute
ALTER TABLE "ConsultationTicketAttribute" ADD COLUMN IF NOT EXISTS "droppedAt" TIMESTAMP(3);
ALTER TABLE "ConsultationTicketAttribute" ADD COLUMN IF NOT EXISTS "droppedBy" INTEGER;
ALTER TABLE "ConsultationTicketAttribute" ADD COLUMN IF NOT EXISTS "dropReason" TEXT;

-- AddForeignKey: ConsultationTicketAttribute.droppedBy -> User.id
ALTER TABLE "ConsultationTicketAttribute" ADD CONSTRAINT "ConsultationTicketAttribute_droppedBy_fkey"
  FOREIGN KEY ("droppedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
