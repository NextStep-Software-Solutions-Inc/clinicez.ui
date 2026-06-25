/*
  Warnings:

  - A unique constraint covering the columns `[soapTransNo]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ConsultationTicket" ADD COLUMN     "soapTransNo" TEXT;

-- CreateTable
CREATE TABLE "PhilHealthKonsultaEnlistment" (
    "id" SERIAL NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "hciCaseNo" TEXT NOT NULL,
    "enlistmentTransNo" TEXT NOT NULL,
    "profilingTransNo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthKonsultaEnlistment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PhilHealthKonsultaEnlistment_clinicPatientId_year_key" ON "PhilHealthKonsultaEnlistment"("clinicPatientId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultationTicket_soapTransNo_key" ON "ConsultationTicket"("soapTransNo");

-- AddForeignKey
ALTER TABLE "PhilHealthKonsultaEnlistment" ADD CONSTRAINT "PhilHealthKonsultaEnlistment_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
