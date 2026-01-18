/*
  Warnings:

  - You are about to drop the column `caseNumber` on the `PhysicalExamination` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `SequenceGenerator` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[caseNumber]` on the table `Appointment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicImagingRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicLaboratoryRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicMedicalCertificate` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `ClinicReferralSlip` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[caseNumber]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[ekasTransactionNumber]` on the table `ConsultationTicket` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[transactionNumber]` on the table `Prescription` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entityType,clinicId,date]` on the table `SequenceGenerator` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[caseNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `date` to the `SequenceGenerator` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='PhysicalExamination_caseNumber_idx') THEN
        DROP INDEX "PhysicalExamination_caseNumber_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='SequenceGenerator_clinicId_year_idx') THEN
        DROP INDEX "SequenceGenerator_clinicId_year_idx";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='SequenceGenerator_entityType_clinicId_year_key') THEN
        DROP INDEX "SequenceGenerator_entityType_clinicId_year_key";
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Appointment' AND column_name='caseNumber') THEN
        ALTER TABLE "Appointment" ADD COLUMN "caseNumber" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Appointment' AND column_name='caseNumberGeneratedAt') THEN
        ALTER TABLE "Appointment" ADD COLUMN "caseNumberGeneratedAt" TIMESTAMP(3);
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicImagingRequest' AND column_name='transactionGeneratedAt') THEN
        ALTER TABLE "ClinicImagingRequest" ADD COLUMN "transactionGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicImagingRequest' AND column_name='transactionNumber') THEN
        ALTER TABLE "ClinicImagingRequest" ADD COLUMN "transactionNumber" TEXT;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicLaboratoryRequest' AND column_name='transactionGeneratedAt') THEN
        ALTER TABLE "ClinicLaboratoryRequest" ADD COLUMN "transactionGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicLaboratoryRequest' AND column_name='transactionNumber') THEN
        ALTER TABLE "ClinicLaboratoryRequest" ADD COLUMN "transactionNumber" TEXT;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicMedicalCertificate' AND column_name='transactionGeneratedAt') THEN
        ALTER TABLE "ClinicMedicalCertificate" ADD COLUMN "transactionGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicMedicalCertificate' AND column_name='transactionNumber') THEN
        ALTER TABLE "ClinicMedicalCertificate" ADD COLUMN "transactionNumber" TEXT;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicReferralSlip' AND column_name='transactionGeneratedAt') THEN
        ALTER TABLE "ClinicReferralSlip" ADD COLUMN "transactionGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicReferralSlip' AND column_name='transactionNumber') THEN
        ALTER TABLE "ClinicReferralSlip" ADD COLUMN "transactionNumber" TEXT;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='caseNumberGeneratedAt') THEN
        ALTER TABLE "ConsultationTicket" ADD COLUMN "caseNumberGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='ekasAuthorizationCode') THEN
        ALTER TABLE "ConsultationTicket" ADD COLUMN "ekasAuthorizationCode" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='ekasTransactionGeneratedAt') THEN
        ALTER TABLE "ConsultationTicket" ADD COLUMN "ekasTransactionGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='ekasTransactionNumber') THEN
        ALTER TABLE "ConsultationTicket" ADD COLUMN "ekasTransactionNumber" TEXT;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PhysicalExamination' AND column_name='caseNumber') THEN
        ALTER TABLE "PhysicalExamination" DROP COLUMN "caseNumber";
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='transactionGeneratedAt') THEN
        ALTER TABLE "Prescription" ADD COLUMN "transactionGeneratedAt" TIMESTAMP(3);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='transactionNumber') THEN
        ALTER TABLE "Prescription" ADD COLUMN "transactionNumber" TEXT;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='SequenceGenerator') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SequenceGenerator' AND column_name='year') THEN
            ALTER TABLE "SequenceGenerator" DROP COLUMN "year";
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SequenceGenerator' AND column_name='date') THEN
            ALTER TABLE "SequenceGenerator" ADD COLUMN "date" TEXT NOT NULL DEFAULT '';
            ALTER TABLE "SequenceGenerator" ALTER COLUMN "date" DROP DEFAULT;
        END IF;
    END IF;
END $$;

-- AlterTable (conditional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='caseNumber') THEN
        ALTER TABLE "User" ADD COLUMN "caseNumber" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='caseNumberGeneratedAt') THEN
        ALTER TABLE "User" ADD COLUMN "caseNumberGeneratedAt" TIMESTAMP(3);
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Appointment' AND column_name='caseNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Appointment_caseNumber_key') THEN
        CREATE UNIQUE INDEX "Appointment_caseNumber_key" ON "Appointment"("caseNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Appointment' AND column_name='caseNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Appointment_caseNumber_idx') THEN
        CREATE INDEX "Appointment_caseNumber_idx" ON "Appointment"("caseNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicImagingRequest' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicImagingRequest_transactionNumber_key') THEN
        CREATE UNIQUE INDEX "ClinicImagingRequest_transactionNumber_key" ON "ClinicImagingRequest"("transactionNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicImagingRequest' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicImagingRequest_transactionNumber_idx') THEN
        CREATE INDEX "ClinicImagingRequest_transactionNumber_idx" ON "ClinicImagingRequest"("transactionNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicLaboratoryRequest' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicLaboratoryRequest_transactionNumber_key') THEN
        CREATE UNIQUE INDEX "ClinicLaboratoryRequest_transactionNumber_key" ON "ClinicLaboratoryRequest"("transactionNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicLaboratoryRequest' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicLaboratoryRequest_transactionNumber_idx') THEN
        CREATE INDEX "ClinicLaboratoryRequest_transactionNumber_idx" ON "ClinicLaboratoryRequest"("transactionNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicMedicalCertificate' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicMedicalCertificate_transactionNumber_key') THEN
        CREATE UNIQUE INDEX "ClinicMedicalCertificate_transactionNumber_key" ON "ClinicMedicalCertificate"("transactionNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicMedicalCertificate' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicMedicalCertificate_transactionNumber_idx') THEN
        CREATE INDEX "ClinicMedicalCertificate_transactionNumber_idx" ON "ClinicMedicalCertificate"("transactionNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicReferralSlip' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicReferralSlip_transactionNumber_key') THEN
        CREATE UNIQUE INDEX "ClinicReferralSlip_transactionNumber_key" ON "ClinicReferralSlip"("transactionNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ClinicReferralSlip' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ClinicReferralSlip_transactionNumber_idx') THEN
        CREATE INDEX "ClinicReferralSlip_transactionNumber_idx" ON "ClinicReferralSlip"("transactionNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='caseNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ConsultationTicket_caseNumber_key') THEN
        CREATE UNIQUE INDEX "ConsultationTicket_caseNumber_key" ON "ConsultationTicket"("caseNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='ekasTransactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ConsultationTicket_ekasTransactionNumber_key') THEN
        CREATE UNIQUE INDEX "ConsultationTicket_ekasTransactionNumber_key" ON "ConsultationTicket"("ekasTransactionNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='ekasTransactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='ConsultationTicket_ekasTransactionNumber_idx') THEN
        CREATE INDEX "ConsultationTicket_ekasTransactionNumber_idx" ON "ConsultationTicket"("ekasTransactionNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Prescription_transactionNumber_key') THEN
        CREATE UNIQUE INDEX "Prescription_transactionNumber_key" ON "Prescription"("transactionNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='Prescription' AND column_name='transactionNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='Prescription_transactionNumber_idx') THEN
        CREATE INDEX "Prescription_transactionNumber_idx" ON "Prescription"("transactionNumber");
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='SequenceGenerator') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='SequenceGenerator_clinicId_date_idx') THEN
            CREATE INDEX "SequenceGenerator_clinicId_date_idx" ON "SequenceGenerator"("clinicId", "date");
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='SequenceGenerator_date_idx') THEN
            CREATE INDEX "SequenceGenerator_date_idx" ON "SequenceGenerator"("date");
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='SequenceGenerator_entityType_clinicId_date_key') THEN
            CREATE UNIQUE INDEX "SequenceGenerator_entityType_clinicId_date_key" ON "SequenceGenerator"("entityType", "clinicId", "date");
        END IF;
    END IF;
END $$;

-- CreateIndex (conditional)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='caseNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='User_caseNumber_key') THEN
        CREATE UNIQUE INDEX "User_caseNumber_key" ON "User"("caseNumber");
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='caseNumber') AND
       NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname='User_caseNumber_idx') THEN
        CREATE INDEX "User_caseNumber_idx" ON "User"("caseNumber");
    END IF;
END $$;
