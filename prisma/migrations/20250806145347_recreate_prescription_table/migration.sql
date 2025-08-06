-- CreateTable
CREATE TABLE "Prescription" (
    "id" SERIAL NOT NULL,
    "serialNumber" TEXT,
    "name" TEXT,
    "remarks" TEXT,
    "consultationTicketId" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "dateArchived" TIMESTAMP(3),
    "templateId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "patientId" INTEGER,
    "hpId" INTEGER,
    "clinicId" INTEGER,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedBy" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Prescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Prescription_serialNumber_key" ON "Prescription"("serialNumber");

-- CreateIndex
CREATE INDEX "prescription_index" ON "Prescription"("clinicId", "patientId", "hpId", "consultationTicketId");

-- CreateIndex
CREATE INDEX "prescription_template_index" ON "Prescription"("templateId");

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Prescription" ADD CONSTRAINT "Prescription_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES "Prescription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
