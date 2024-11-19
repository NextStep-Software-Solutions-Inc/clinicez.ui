/*
  Warnings:

  - A unique constraint covering the columns `[healthcareProviderId]` on the table `HealthcareProviderSchedule` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[healthcareProviderId]` on the table `HealthcareProviderScheduleException` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProviderSchedule_healthcareProviderId_key" ON "HealthcareProviderSchedule"("healthcareProviderId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProviderScheduleException_healthcareProviderId_key" ON "HealthcareProviderScheduleException"("healthcareProviderId");
