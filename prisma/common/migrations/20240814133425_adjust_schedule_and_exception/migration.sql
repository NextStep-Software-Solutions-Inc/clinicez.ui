-- CreateTable
CREATE TABLE "HealthcareProviderSchedule" (
    "id" SERIAL NOT NULL,
    "healthcareProviderId" INTEGER NOT NULL,
    "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "pattern" TEXT NOT NULL DEFAULT 'weekly',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HealthcareProviderSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthcareProviderScheduleException" (
    "id" SERIAL NOT NULL,
    "healthcareProviderId" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "exceptionType" TEXT NOT NULL DEFAULT 'override',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "HealthcareProviderScheduleException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "healthcare_provider_schedule_index" ON "HealthcareProviderSchedule"("healthcareProviderId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "healthcare_provider_schedule_exception_index" ON "HealthcareProviderScheduleException"("healthcareProviderId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "HealthcareProviderSchedule" ADD CONSTRAINT "HealthcareProviderSchedule_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProviderScheduleException" ADD CONSTRAINT "HealthcareProviderScheduleException_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
