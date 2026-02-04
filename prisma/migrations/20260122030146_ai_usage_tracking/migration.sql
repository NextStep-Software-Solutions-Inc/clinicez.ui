-- CreateTable
CREATE TABLE IF NOT EXISTS "AIUsageLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" INTEGER,
    "tenantId" INTEGER,
    "featureType" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptTokens" INTEGER NOT NULL DEFAULT 0,
    "completionTokens" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "estimatedCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AIUsageLimit" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER,
    "tenantId" INTEGER,
    "limitType" TEXT NOT NULL DEFAULT 'MONTHLY',
    "maxRequests" INTEGER NOT NULL DEFAULT 1000,
    "maxTokens" INTEGER,
    "maxCostUSD" DOUBLE PRECISION,
    "resetDay" INTEGER DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIUsageLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "AIUsageSummary" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER,
    "tenantId" INTEGER,
    "period" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "totalTokens" INTEGER NOT NULL DEFAULT 0,
    "totalCostUSD" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successfulRequests" INTEGER NOT NULL DEFAULT 0,
    "failedRequests" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIUsageSummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIUsageLog_userId_idx" ON "AIUsageLog"("userId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_clinicId_idx" ON "AIUsageLog"("clinicId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_tenantId_idx" ON "AIUsageLog"("tenantId");
CREATE INDEX IF NOT EXISTS "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");
CREATE INDEX IF NOT EXISTS "AIUsageLog_featureType_idx" ON "AIUsageLog"("featureType");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AIUsageLimit_clinicId_key" ON "AIUsageLimit"("clinicId");
CREATE UNIQUE INDEX IF NOT EXISTS "AIUsageLimit_tenantId_key" ON "AIUsageLimit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "AIUsageSummary_clinicId_period_key" ON "AIUsageSummary"("clinicId", "period");
CREATE UNIQUE INDEX IF NOT EXISTS "AIUsageSummary_tenantId_period_key" ON "AIUsageSummary"("tenantId", "period");

-- AddForeignKey (if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Clinic') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AIUsageLog_clinicId_fkey') THEN
            ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AIUsageLimit_clinicId_fkey') THEN
            ALTER TABLE "AIUsageLimit" ADD CONSTRAINT "AIUsageLimit_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AIUsageSummary_clinicId_fkey') THEN
            ALTER TABLE "AIUsageSummary" ADD CONSTRAINT "AIUsageSummary_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tenant') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AIUsageLog_tenantId_fkey') THEN
            ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AIUsageLimit_tenantId_fkey') THEN
            ALTER TABLE "AIUsageLimit" ADD CONSTRAINT "AIUsageLimit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'AIUsageSummary_tenantId_fkey') THEN
            ALTER TABLE "AIUsageSummary" ADD CONSTRAINT "AIUsageSummary_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
    END IF;
END $$;
