-- DropForeignKey
ALTER TABLE "UserStudentRecord" DROP CONSTRAINT "UserStudentRecord_userOrganizationRoleId_fkey";

-- CreateTable
CREATE TABLE "ClinicMedicalCertificate" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "hpId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "reasonId" INTEGER NOT NULL,
    "findingId" INTEGER NOT NULL,
    "classificationId" INTEGER NOT NULL,

    CONSTRAINT "ClinicMedicalCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCertificateReason" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "documentTemplateId" INTEGER NOT NULL,

    CONSTRAINT "MedicalCertificateReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCertificateFinding" (
    "id" SERIAL NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MedicalCertificateFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCertificateClassification" (
    "id" SERIAL NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MedicalCertificateClassification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCertificateReason_name_key" ON "MedicalCertificateReason"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCertificateReason_name_documentTemplateId_key" ON "MedicalCertificateReason"("name", "documentTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCertificateFinding_documentTemplateId_name_key" ON "MedicalCertificateFinding"("documentTemplateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCertificateClassification_documentTemplateId_name_key" ON "MedicalCertificateClassification"("documentTemplateId", "name");

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "OrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "MedicalCertificateReason"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_hpId_fkey" FOREIGN KEY ("hpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_findingId_fkey" FOREIGN KEY ("findingId") REFERENCES "MedicalCertificateFinding"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicMedicalCertificate" ADD CONSTRAINT "ClinicMedicalCertificate_classificationId_fkey" FOREIGN KEY ("classificationId") REFERENCES "MedicalCertificateClassification"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicalCertificateReason" ADD CONSTRAINT "MedicalCertificateReason_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicalCertificateFinding" ADD CONSTRAINT "MedicalCertificateFinding_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MedicalCertificateClassification" ADD CONSTRAINT "MedicalCertificateClassification_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
