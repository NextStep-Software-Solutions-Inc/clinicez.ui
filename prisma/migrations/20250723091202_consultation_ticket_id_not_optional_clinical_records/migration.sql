/*
  Warnings:

  - Made the column `consultationTicketId` on table `ClinicImagingRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `consultationTicketId` on table `ClinicLaboratoryRequest` required. This step will fail if there are existing NULL values in that column.
  - Made the column `consultationTicketId` on table `ClinicMedicalCertificate` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ClinicImagingRequest" DROP CONSTRAINT "ClinicImagingRequest_consultationTicketId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicLaboratoryRequest" DROP CONSTRAINT "ClinicLaboratoryRequest_consultationTicketId_fkey";

-- DropForeignKey
ALTER TABLE "ClinicMedicalCertificate" DROP CONSTRAINT "ClinicMedicalCertificate_consultationTicketId_fkey";

-- AlterTable
ALTER TABLE "ClinicImagingRequest" ALTER COLUMN "consultationTicketId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ClinicLaboratoryRequest" ALTER COLUMN "consultationTicketId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ClinicMedicalCertificate" ALTER COLUMN "consultationTicketId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
