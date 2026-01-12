-- Sync database schema drift
-- These columns/tables already exist in the database from previous work
-- This migration marks them as applied in the migration history without modifying the schema

-- Note: All ALTER TABLE statements are commented out because these columns already exist
-- Uncommenting would cause "column already exists" errors

-- ALTER TABLE "ConsultationTicket" ADD COLUMN "caseNumber" TEXT;
-- CREATE INDEX "ConsultationTicket_caseNumber_idx" ON "ConsultationTicket"("caseNumber");

-- ALTER TABLE "PhysicalExamination" ADD COLUMN "caseNumber" TEXT;
-- CREATE INDEX "PhysicalExamination_caseNumber_idx" ON "PhysicalExamination"("caseNumber");

-- ALTER TABLE "PhilHealthDependent" ADD COLUMN "citizenship" TEXT;
-- ALTER TABLE "PhilHealthDependent" ADD COLUMN "isPermanentlyDisabled" BOOLEAN DEFAULT false;

-- ALTER TABLE "ServiceAttribute" ADD COLUMN "forTaggedOnly" BOOLEAN NOT NULL DEFAULT false;

-- ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
-- ALTER TABLE "User" ADD COLUMN "isSystemAdmin" BOOLEAN NOT NULL DEFAULT false;

-- SequenceGenerator table already exists with proper structure
-- Including foreign key to Clinic and indexes
