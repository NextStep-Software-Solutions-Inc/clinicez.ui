-- Step 1: Delete duplicate HealthcareProvider records, keeping only the one with the lowest id per user
-- This ensures each user has at most one HP profile before applying the new constraint
DELETE FROM "HealthcareProvider"
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM "HealthcareProvider" 
    GROUP BY "userId"
);

-- Step 2: Drop the old unique constraint that allowed multiple HP profiles per user (one per type)
DROP INDEX IF EXISTS "HealthcareProvider_userId_hpTypeId_key";

-- Step 3: Create the new unique constraint that enforces single HP profile per user
CREATE UNIQUE INDEX "HealthcareProvider_userId_key" ON "HealthcareProvider"("userId");
