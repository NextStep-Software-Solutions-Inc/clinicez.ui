-- Migration: Enforce single Healthcare Provider profile per user
-- This migration converts the system from allowing multiple HP profiles per user (one per type)
-- to allowing only a single HP profile per user.

-- Step 1: Soft-delete duplicate HealthcareProvider records by setting isActive = false
-- This keeps the record with the lowest id per user active and deactivates the rest
-- This approach preserves data integrity with foreign keys and allows for data recovery if needed
UPDATE "HealthcareProvider"
SET "isActive" = false, "deletedAt" = NOW()
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM "HealthcareProvider" 
    WHERE "isActive" = true
    GROUP BY "userId"
) AND "isActive" = true;

-- Step 2: Drop the old unique constraint that allowed multiple HP profiles per user (one per type)
DROP INDEX IF EXISTS "HealthcareProvider_userId_hpTypeId_key";

-- Step 3: Create a partial unique index that enforces single HP profile per user
-- This only applies to active records, allowing soft-deleted records to remain in the database
CREATE UNIQUE INDEX "HealthcareProvider_userId_active_key" ON "HealthcareProvider"("userId") WHERE "isActive" = true;

-- Step 4: Create a regular index for userId lookups (for query performance)
CREATE INDEX IF NOT EXISTS "idx_healthcare_provider_user" ON "HealthcareProvider"("userId");

