/*
  Warnings:

  - Added the required column `consultationTicketId` to the `Medication` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "medication_index";

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "consultationTicketId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "medication_index" ON "Medication"("patientId", "hpId", "consultationTicketId");

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
