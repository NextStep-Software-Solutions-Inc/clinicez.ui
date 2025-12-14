-- Migration: Add case number and sequence generator
-- This migration adds:
-- 1. caseNumber field to ConsultationTicket
-- 2. caseNumber field to PhysicalExamination
-- 3. SequenceGenerator table for auto-incrementing case numbers

-- Add caseNumber to ConsultationTicket
ALTER TABLE "ConsultationTicket" ADD COLUMN "caseNumber" TEXT;
CREATE INDEX "ConsultationTicket_caseNumber_idx" ON "ConsultationTicket"("caseNumber");

-- Add caseNumber to PhysicalExamination
ALTER TABLE "PhysicalExamination" ADD COLUMN "caseNumber" TEXT;
CREATE INDEX "PhysicalExamination_caseNumber_idx" ON "PhysicalExamination"("caseNumber");

-- Create SequenceGenerator table
CREATE TABLE "SequenceGenerator" (
    "id" SERIAL NOT NULL,
    "entityType" TEXT NOT NULL,
    "clinicId" INTEGER,
    "year" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SequenceGenerator_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint on entityType, clinicId, year
CREATE UNIQUE INDEX "SequenceGenerator_entityType_clinicId_year_key" ON "SequenceGenerator"("entityType", "clinicId", "year");

-- Create index on clinicId, year
CREATE INDEX "SequenceGenerator_clinicId_year_idx" ON "SequenceGenerator"("clinicId", "year");

-- Add foreign key constraint
ALTER TABLE "SequenceGenerator" ADD CONSTRAINT "SequenceGenerator_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
