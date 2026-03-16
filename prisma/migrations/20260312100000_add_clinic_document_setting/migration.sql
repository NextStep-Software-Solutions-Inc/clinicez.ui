-- CreateTable
CREATE TABLE "ClinicDocumentDefaultTemplate" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTypeId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,

    CONSTRAINT "ClinicDocumentDefaultTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ClinicDocumentDefaultTemplate_clinicId_documentTypeId_key" ON "ClinicDocumentDefaultTemplate"("clinicId", "documentTypeId");

-- AddForeignKey
ALTER TABLE "ClinicDocumentDefaultTemplate" ADD CONSTRAINT "ClinicDocumentDefaultTemplate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicDocumentDefaultTemplate" ADD CONSTRAINT "ClinicDocumentDefaultTemplate_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentTemplateType"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicDocumentDefaultTemplate" ADD CONSTRAINT "ClinicDocumentDefaultTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
