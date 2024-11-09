-- CreateTable
CREATE TABLE "ClinicPrescriptionSetting" (
    "id" SERIAL NOT NULL,
    "orgUid" TEXT NOT NULL,
    "prescriptionTemplateId" INTEGER,

    CONSTRAINT "ClinicPrescriptionSetting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClinicPrescriptionSetting" ADD CONSTRAINT "ClinicPrescriptionSetting_prescriptionTemplateId_fkey" FOREIGN KEY ("prescriptionTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
