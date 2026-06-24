/*
  Warnings:

  - You are about to drop the column `hciCaseNo` on the `KonsultaEntry` table. All the data in the column will be lost.
  - You are about to drop the column `hciTransNo` on the `KonsultaEntry` table. All the data in the column will be lost.
  - You are about to drop the column `memberPin` on the `KonsultaEntry` table. All the data in the column will be lost.
  - You are about to drop the column `memberType` on the `KonsultaEntry` table. All the data in the column will be lost.
  - You are about to drop the column `philHealthPin` on the `KonsultaEntry` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "KonsultaEntry_batchId_patientUserId_key";

-- DropIndex
DROP INDEX "KonsultaEntry_philHealthPin_idx";

-- AlterTable
ALTER TABLE "KonsultaEntry" DROP COLUMN "hciCaseNo",
DROP COLUMN "hciTransNo",
DROP COLUMN "memberPin",
DROP COLUMN "memberType",
DROP COLUMN "philHealthPin";

-- CreateIndex
CREATE INDEX "KonsultaEntry_batchId_patientUserId_idx" ON "KonsultaEntry"("batchId", "patientUserId");
