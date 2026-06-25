-- CreateTable
CREATE TABLE "KonsultaBatchReport" (
    "id" TEXT NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "tagging" TEXT NOT NULL,
    "transmittalNo" TEXT,
    "xmlPayload" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validationResult" TEXT,
    "submissionResult" TEXT,
    "validatedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "KonsultaBatchReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KonsultaBatchPatient" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "tagging" TEXT NOT NULL,
    "isSelected" BOOLEAN NOT NULL DEFAULT true,
    "selectedTicketIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "KonsultaBatchPatient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaBatchReport_transmittalNo_key" ON "KonsultaBatchReport"("transmittalNo");

-- CreateIndex
CREATE UNIQUE INDEX "KonsultaBatchPatient_batchId_clinicPatientId_key" ON "KonsultaBatchPatient"("batchId", "clinicPatientId");

-- AddForeignKey
ALTER TABLE "KonsultaBatchReport" ADD CONSTRAINT "KonsultaBatchReport_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "KonsultaBatchReport" ADD CONSTRAINT "KonsultaBatchReport_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "KonsultaBatchPatient" ADD CONSTRAINT "KonsultaBatchPatient_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "KonsultaBatchReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KonsultaBatchPatient" ADD CONSTRAINT "KonsultaBatchPatient_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
