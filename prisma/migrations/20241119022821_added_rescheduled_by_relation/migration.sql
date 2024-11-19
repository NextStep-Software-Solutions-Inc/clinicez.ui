-- AddForeignKey
ALTER TABLE "AppointmentAttribute" ADD CONSTRAINT "AppointmentAttribute_rescheduledBy_fkey" FOREIGN KEY ("rescheduledBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
