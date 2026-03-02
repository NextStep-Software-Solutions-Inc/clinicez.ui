-- CreateTable
CREATE TABLE IF NOT EXISTS "AIGeneratedInsight" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "clinicId" INTEGER,
    "content" TEXT NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIGeneratedInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIGeneratedInsight_type_entityType_entityId_clinicId_idx" ON "AIGeneratedInsight"("type", "entityType", "entityId", "clinicId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AIGeneratedInsight_validUntil_idx" ON "AIGeneratedInsight"("validUntil");

-- AddForeignKey
ALTER TABLE "AIGeneratedInsight" ADD CONSTRAINT IF NOT EXISTS "AIGeneratedInsight_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
