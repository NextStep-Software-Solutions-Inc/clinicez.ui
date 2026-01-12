-- Comprehensive sync migration for all database drift
-- Adds all missing columns and creates SequenceGenerator table with IF NOT EXISTS where possible

-- Add caseNumber to ConsultationTicket if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ConsultationTicket' AND column_name='caseNumber') THEN
        ALTER TABLE "ConsultationTicket" ADD COLUMN "caseNumber" TEXT;
        CREATE INDEX "ConsultationTicket_caseNumber_idx" ON "ConsultationTicket"("caseNumber");
    END IF;
END $$;

-- Add caseNumber to PhysicalExamination if it doesn't exist  
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PhysicalExamination' AND column_name='caseNumber') THEN
        ALTER TABLE "PhysicalExamination" ADD COLUMN "caseNumber" TEXT;
        CREATE INDEX "PhysicalExamination_caseNumber_idx" ON "PhysicalExamination"("caseNumber");
    END IF;
END $$;

-- Add columns to PhilHealthDependent if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PhilHealthDependent' AND column_name='citizenship') THEN
        ALTER TABLE "PhilHealthDependent" ADD COLUMN "citizenship" TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='PhilHealthDependent' AND column_name='isPermanentlyDisabled') THEN
        ALTER TABLE "PhilHealthDependent" ADD COLUMN "isPermanentlyDisabled" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- Create SequenceGenerator table if it doesn't exist
CREATE TABLE IF NOT EXISTS "SequenceGenerator" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "entityType" TEXT NOT NULL,
    "clinicId" INTEGER,
    "year" INTEGER NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SequenceGenerator_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add year column to SequenceGenerator if it doesn't exist (for existing tables)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='SequenceGenerator') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='SequenceGenerator' AND column_name='year') THEN
            ALTER TABLE "SequenceGenerator" ADD COLUMN "year" INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM CURRENT_DATE);
        END IF;
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "SequenceGenerator_entityType_clinicId_year_key" ON "SequenceGenerator"("entityType", "clinicId", "year");
CREATE INDEX IF NOT EXISTS "SequenceGenerator_clinicId_year_idx" ON "SequenceGenerator"("clinicId", "year");

-- Clean up removed columns that might still exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isSuperAdmin') THEN
        ALTER TABLE "User" DROP COLUMN "isSuperAdmin";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='User' AND column_name='isSystemAdmin') THEN
        ALTER TABLE "User" DROP COLUMN "isSystemAdmin";
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ServiceAttribute' AND column_name='forTaggedOnly') THEN
        ALTER TABLE "ServiceAttribute" DROP COLUMN "forTaggedOnly";
    END IF;
END $$;
