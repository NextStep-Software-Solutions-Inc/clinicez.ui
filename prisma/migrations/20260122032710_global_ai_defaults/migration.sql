-- CreateTable
CREATE TABLE IF NOT EXISTS "GlobalAIDefaults" (
    "id" SERIAL NOT NULL,
    "defaultMaxRequests" INTEGER NOT NULL DEFAULT 1000,
    "defaultMaxTokens" INTEGER,
    "defaultMaxCostUSD" DOUBLE PRECISION,
    "defaultResetDay" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalAIDefaults_pkey" PRIMARY KEY ("id")
);

-- Ensure only one row exists (singleton pattern)
CREATE UNIQUE INDEX IF NOT EXISTS "GlobalAIDefaults_id_key" ON "GlobalAIDefaults"("id");

-- Insert default values if table is empty
INSERT INTO "GlobalAIDefaults" ("id", "defaultMaxRequests", "defaultMaxTokens", "defaultMaxCostUSD", "defaultResetDay", "updatedAt")
SELECT 1, 1000, 500000, 100.00, 1, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM "GlobalAIDefaults" WHERE "id" = 1);
