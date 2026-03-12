-- CreateTable
CREATE TABLE "ClinicDocumentSetting" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "medCertTemplateId" INTEGER,
    "labTemplateId" INTEGER,
    "imagingTemplateId" INTEGER,
    "heartStationTemplateId" INTEGER,

    CONSTRAINT "ClinicDocumentSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicDocumentSetting_clinicId_key" ON "ClinicDocumentSetting"("clinicId");

-- AddForeignKey
ALTER TABLE "ClinicDocumentSetting" ADD CONSTRAINT "ClinicDocumentSetting_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicDocumentSetting" ADD CONSTRAINT "ClinicDocumentSetting_medCertTemplateId_fkey" FOREIGN KEY ("medCertTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicDocumentSetting" ADD CONSTRAINT "ClinicDocumentSetting_labTemplateId_fkey" FOREIGN KEY ("labTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicDocumentSetting" ADD CONSTRAINT "ClinicDocumentSetting_imagingTemplateId_fkey" FOREIGN KEY ("imagingTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicDocumentSetting" ADD CONSTRAINT "ClinicDocumentSetting_heartStationTemplateId_fkey" FOREIGN KEY ("heartStationTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
