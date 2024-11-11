-- AlterTable
ALTER TABLE "ConsultationTicketAttribute" ADD COLUMN     "allowOtherHPToAddVitals" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "allowPatientToAddVitals" BOOLEAN NOT NULL DEFAULT false;
