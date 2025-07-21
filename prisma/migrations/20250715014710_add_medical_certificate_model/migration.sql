-- AlterTable
ALTER TABLE "ClinicMedicalCertificate" ADD COLUMN     "consultationTicketId" INTEGER;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
