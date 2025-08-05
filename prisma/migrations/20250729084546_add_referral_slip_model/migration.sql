-- CreateTable
CREATE TABLE "ReferralReason" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralReason_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicReferralSlip" (
    "id" SERIAL NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "documentTemplateId" INTEGER NOT NULL,
    "clinicPatientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reasonId" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" INTEGER,
    "serialNumber" TEXT NOT NULL,
    "referredToId" INTEGER NOT NULL,
    "consultationTicketId" INTEGER NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "history" TEXT,
    "impression" TEXT,
    "recommendation" TEXT,

    CONSTRAINT "ClinicReferralSlip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralReason_name_key" ON "ReferralReason"("name");

-- CreateIndex
CREATE INDEX "referral_reason_name_index" ON "ReferralReason"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicReferralSlip_serialNumber_key" ON "ClinicReferralSlip"("serialNumber");

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_documentTemplateId_fkey" FOREIGN KEY ("documentTemplateId") REFERENCES "DocumentTemplate"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_clinicPatientId_fkey" FOREIGN KEY ("clinicPatientId") REFERENCES "ClinicPatient"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_reasonId_fkey" FOREIGN KEY ("reasonId") REFERENCES "ReferralReason"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_referredToId_fkey" FOREIGN KEY ("referredToId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_consultationTicketId_fkey" FOREIGN KEY ("consultationTicketId") REFERENCES "ConsultationTicket"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ClinicReferralSlip" ADD CONSTRAINT "ClinicReferralSlip_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
