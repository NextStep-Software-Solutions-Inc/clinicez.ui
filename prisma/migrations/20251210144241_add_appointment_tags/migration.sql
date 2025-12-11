-- CreateTable
CREATE TABLE "AppointmentTag" (
    "id" SERIAL NOT NULL,
    "appointmentId" INTEGER NOT NULL,
    "healthcareProviderId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppointmentTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentTag_appointmentId_healthcareProviderId_key" ON "AppointmentTag"("appointmentId", "healthcareProviderId");

-- AddForeignKey
ALTER TABLE "AppointmentTag" ADD CONSTRAINT "AppointmentTag_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AppointmentTag" ADD CONSTRAINT "AppointmentTag_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
