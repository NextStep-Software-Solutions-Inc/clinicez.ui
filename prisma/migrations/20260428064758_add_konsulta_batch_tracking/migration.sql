-- CreateEnum
CREATE TYPE "KonsultaBatchStatus" AS ENUM ('DRAFT', 'GENERATED', 'VALIDATED', 'SUBMITTED', 'FAILED');

-- CreateTable
CREATE TABLE "KonsultaBatch" (
    "id" SERIAL NOT NULL,
    "batchUid" TEXT NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "reportTagging" TEXT NOT NULL DEFAULT '1',
    "transmittalNo" TEXT,
    "status" "KonsultaBatchStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "xmlPayload" TEXT,
    "validateResult" JSONB,
    "submitResult" JSONB,
    "errorMessage" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "KonsultaBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaEntry" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "patientUserId" INTEGER NOT NULL,
    "philHealthPin" TEXT NOT NULL,
    "memberType" TEXT NOT NULL,
    "consultationIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "included" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KonsultaEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaBatch_batchUid_key" ON "KonsultaBatch"("batchUid");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaBatch_transmittalNo_key" ON "KonsultaBatch"("transmittalNo");

-- CreateIndex
CREATE INDEX "KonsultaBatch_clinicId_period_idx" ON "KonsultaBatch"("clinicId", "period");

-- CreateIndex
CREATE INDEX "KonsultaBatch_status_idx" ON "KonsultaBatch"("status");

-- CreateIndex
CREATE INDEX "KonsultaEntry_batchId_idx" ON "KonsultaEntry"("batchId");

-- CreateIndex
CREATE INDEX "KonsultaEntry_philHealthPin_idx" ON "KonsultaEntry"("philHealthPin");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaEntry_batchId_patientUserId_key" ON "KonsultaEntry"("batchId", "patientUserId");

-- AddForeignKey
ALTER TABLE "KonsultaBatch" ADD CONSTRAINT "KonsultaBatch_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "KonsultaBatch" ADD CONSTRAINT "KonsultaBatch_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "KonsultaEntry" ADD CONSTRAINT "KonsultaEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "KonsultaBatch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "KonsultaEntry" ADD CONSTRAINT "KonsultaEntry_patientUserId_fkey" FOREIGN KEY ("patientUserId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
