/*
  Warnings:

  - You are about to drop the column `hpId` on the `ConsultationTicket` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConsultationTicket" DROP CONSTRAINT "ConsultationTicket_hpId_fkey";

-- AlterTable
ALTER TABLE "ConsultationTicket" DROP COLUMN "hpId";
