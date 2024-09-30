/*
  Warnings:

  - You are about to drop the column `createdBy` on the `ConsultationTicket` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ConsultationTicket" DROP COLUMN "createdBy";

-- CreateTable
CREATE TABLE "ConsultationTicketAuthor" (
    "id" SERIAL NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "hpId" TEXT NOT NULL,

    CONSTRAINT "ConsultationTicketAuthor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicketAuthor_consultationTicketId_hpId_key" ON "ConsultationTicketAuthor"("consultationTicketId", "hpId");

-- AddForeignKey
ALTER TABLE "ConsultationTicketAuthor" ADD CONSTRAINT "ConsultationTicketAuthor_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
