-- AlterTable
ALTER TABLE "HealthcareProviderScheduleException" ADD COLUMN     "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pattern" TEXT NOT NULL DEFAULT 'weekly',
ADD COLUMN     "weekOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ALTER COLUMN "priority" SET DEFAULT 1;
