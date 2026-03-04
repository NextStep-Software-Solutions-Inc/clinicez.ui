-- Create master ICD-10 code reference table
CREATE TABLE IF NOT EXISTS "ICD10Code" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ICD10Code_pkey" PRIMARY KEY ("id")
);

-- Unique index on code
CREATE UNIQUE INDEX IF NOT EXISTS "ICD10Code_code_key" ON "ICD10Code"("code");

-- Supporting indexes
CREATE INDEX IF NOT EXISTS "ICD10Code_code_idx" ON "ICD10Code"("code");
CREATE INDEX IF NOT EXISTS "ICD10Code_category_idx" ON "ICD10Code"("category");
