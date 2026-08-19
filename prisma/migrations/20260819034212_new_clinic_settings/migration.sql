/*
  Warnings:

  - You are about to drop the column `konsultaPassword` on the `ClinicSetting` table. All the data in the column will be lost.
  - You are about to drop the column `konsultaUsername` on the `ClinicSetting` table. All the data in the column will be lost.
  - You are about to drop the column `pmccNumber` on the `ClinicSetting` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ClinicSetting" DROP COLUMN "konsultaPassword",
DROP COLUMN "konsultaUsername",
DROP COLUMN "pmccNumber";

-- AlterTable
ALTER TABLE "ConsultationTicket" ALTER COLUMN "konsultaIsWalkedIn" DROP NOT NULL,
ALTER COLUMN "konsultaIsWalkedIn" DROP DEFAULT;
