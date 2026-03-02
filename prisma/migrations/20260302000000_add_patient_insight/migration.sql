-- CreateTable
CREATE TABLE IF NOT EXISTS "PatientInsight" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "clinicId" INTEGER,
    "content" TEXT NOT NULL,
    "generatedByUserId" TEXT NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PatientInsight_patientId_clinicId_idx" ON "PatientInsight"("patientId", "clinicId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PatientInsight_validUntil_idx" ON "PatientInsight"("validUntil");

-- AddForeignKey
ALTER TABLE "PatientInsight" ADD CONSTRAINT IF NOT EXISTS "PatientInsight_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInsight" ADD CONSTRAINT IF NOT EXISTS "PatientInsight_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
