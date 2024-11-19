/*
  Warnings:

  - The `daysOfWeek` column on the `HealthcareProviderSchedule` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropIndex
DROP INDEX "HealthcareProviderScheduleException_healthcareProviderId_key";

-- AlterTable
ALTER TABLE "HealthcareProviderSchedule" ADD COLUMN     "weekOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
DROP COLUMN "daysOfWeek",
ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
