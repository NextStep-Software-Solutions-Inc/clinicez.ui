-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
