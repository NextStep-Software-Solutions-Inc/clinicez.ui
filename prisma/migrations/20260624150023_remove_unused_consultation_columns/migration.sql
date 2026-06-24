/*
  Warnings:

  - You are about to drop the column `caseNumber` on the `ConsultationTicket` table. All the data in the column will be lost.
  - You are about to drop the column `caseNumberGeneratedAt` on the `ConsultationTicket` table. All the data in the column will be lost.
  - You are about to drop the column `ekasAuthorizationCode` on the `ConsultationTicket` table. All the data in the column will be lost.
  - You are about to drop the column `ekasTransactionGeneratedAt` on the `ConsultationTicket` table. All the data in the column will be lost.
  - You are about to drop the column `ekasTransactionNumber` on the `ConsultationTicket` table. All the data in the column will be lost.
  - You are about to drop the column `konsultaHciCaseNo` on the `ConsultationTicket` table. All the data in the column will be lost.
  - You are about to drop the column `konsultaHciTransNo` on the `ConsultationTicket` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[soapTransNo]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ConsultationTicket_caseNumber_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_caseNumber_key";

-- DropIndex
DROP INDEX "ConsultationTicket_ekasTransactionNumber_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_ekasTransactionNumber_key";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciCaseNo_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciCaseNo_key";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciTransNo_idx";

-- DropIndex
DROP INDEX "ConsultationTicket_konsultaHciTransNo_key";

-- AlterTable
ALTER TABLE "ConsultationTicket" DROP COLUMN "caseNumber",
DROP COLUMN "caseNumberGeneratedAt",
DROP COLUMN "ekasAuthorizationCode",
DROP COLUMN "ekasTransactionGeneratedAt",
DROP COLUMN "ekasTransactionNumber",
DROP COLUMN "konsultaHciCaseNo",
DROP COLUMN "konsultaHciTransNo",
ADD COLUMN     "soapTransNo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicket_soapTransNo_key" ON "ConsultationTicket"("soapTransNo");
