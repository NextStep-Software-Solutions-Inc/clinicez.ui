-- CreateTable
CREATE TABLE "ImagingDiagnostic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,

    CONSTRAINT "ImagingDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryDiagnostic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT NOT NULL,

    CONSTRAINT "LaboratoryDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicImagingRequest" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "history" TEXT,
    "impression" TEXT,
    "reason" TEXT,
    "updatedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "serialNumber" TEXT NOT NULL,
    "consultationTicketId" INTEGER,

    CONSTRAINT "ClinicImagingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicLaboratoryRequest" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "impression" TEXT,
    "updatedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "serialNumber" TEXT NOT NULL,
    "consultationTicketId" INTEGER,

    CONSTRAINT "ClinicLaboratoryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicLaboratoryRequestDiagnostic" (
    "id" SERIAL NOT NULL,
    "clinicLaboratoryRequestId" INTEGER NOT NULL,
    "laboratoryDiagnosticId" INTEGER NOT NULL,

    CONSTRAINT "ClinicLaboratoryRequestDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImagingRequestDiagnostic" (
    "id" SERIAL NOT NULL,
    "clinicImagingRequestId" INTEGER NOT NULL,
    "imagingDiagnosticId" INTEGER NOT NULL,

    CONSTRAINT "ImagingRequestDiagnostic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ImagingDiagnostic_name_category_key" ON "ImagingDiagnostic"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LaboratoryDiagnostic_name_category_key" ON "LaboratoryDiagnostic"("name", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicImagingRequest_serialNumber_key" ON "ClinicImagingRequest"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLaboratoryRequest_serialNumber_key" ON "ClinicLaboratoryRequest"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLaboratoryRequestDiagnostic_clinicLaboratoryRequestId_key" ON "ClinicLaboratoryRequestDiagnostic"("clinicLaboratoryRequestId", "laboratoryDiagnosticId");

-- CreateIndex
CREATE UNIQUE INDEX "ImagingRequestDiagnostic_clinicImagingRequestId_imagingDiag_key" ON "ImagingRequestDiagnostic"("clinicImagingRequestId", "imagingDiagnosticId");

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicImagingRequest" ADD CONSTRAINT "ClinicImagingRequest_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequest" ADD CONSTRAINT "ClinicLaboratoryRequest_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequestDiagnostic" ADD CONSTRAINT "ClinicLaboratoryRequestDiagnostic_clinicLaboratoryRequestI_fkey" FOREIGN KEY ("clinicLaboratoryRequestId") REFERENCES "ClinicLaboratoryRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicLaboratoryRequestDiagnostic" ADD CONSTRAINT "ClinicLaboratoryRequestDiagnostic_laboratoryDiagnosticId_fkey" FOREIGN KEY ("laboratoryDiagnosticId") REFERENCES "LaboratoryDiagnostic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ImagingRequestDiagnostic" ADD CONSTRAINT "ImagingRequestDiagnostic_clinicImagingRequestId_fkey" FOREIGN KEY ("clinicImagingRequestId") REFERENCES "ClinicImagingRequest"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ImagingRequestDiagnostic" ADD CONSTRAINT "ImagingRequestDiagnostic_imagingDiagnosticId_fkey" FOREIGN KEY ("imagingDiagnosticId") REFERENCES "ImagingDiagnostic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
