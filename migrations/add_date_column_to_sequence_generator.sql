-- Migration: Add date column to SequenceGenerator for timestamp-based sequences
-- This migration adds the 'date' column alongside the existing 'year' column
-- to support timestamp-based sequence generation

-- Step 1: Add new 'date' column (nullable initially)
ALTER TABLE "SequenceGenerator" ADD COLUMN "date" TEXT;

-- Step 2: Backfill existing data using updatedAt or createdAt timestamps
-- This preserves chronological accuracy better than using year + '0101'
-- Note: Using PostgreSQL syntax. Adjust for other databases if needed:
--   MySQL: DATE_FORMAT(COALESCE(updatedAt, createdAt), '%Y%m%d')
--   SQLite: strftime('%Y%m%d', COALESCE(updatedAt, createdAt))
UPDATE "SequenceGenerator" 
SET "date" = TO_CHAR(COALESCE("updatedAt", "createdAt"), 'YYYYMMDD')
WHERE "date" IS NULL;

-- For any remaining NULL values (should not happen), use year-based fallback
UPDATE "SequenceGenerator" 
SET "date" = "year"::text || '0101' 
WHERE "date" IS NULL;

-- Step 3: Create index on date column for performance
CREATE INDEX "SequenceGenerator_date_idx" ON "SequenceGenerator"("date");

-- Step 4: Create new unique constraint including date
-- Note: This will coexist with the old constraint during transition
CREATE UNIQUE INDEX "SequenceGenerator_entityType_clinicId_date_key" 
  ON "SequenceGenerator"("entityType", "clinicId", "date");

-- Step 5: Create new composite index for efficient queries
CREATE INDEX "SequenceGenerator_clinicId_date_idx" 
  ON "SequenceGenerator"("clinicId", "date");

-- Note: The 'year' column and old constraints will be removed in a future migration
-- after confirming the new timestamp-based system is working correctly
