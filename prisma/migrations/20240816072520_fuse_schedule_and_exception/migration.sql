/*
  Warnings:

  - You are about to drop the `HealthcareProviderSchedule` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `HealthcareProviderScheduleException` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "HealthcareProviderSchedule" DROP CONSTRAINT "HealthcareProviderSchedule_healthcareProviderId_fkey";

-- DropForeignKey
ALTER TABLE "HealthcareProviderScheduleException" DROP CONSTRAINT "HealthcareProviderScheduleException_healthcareProviderId_fkey";

-- DropTable
DROP TABLE "HealthcareProviderSchedule";

-- DropTable
DROP TABLE "HealthcareProviderScheduleException";

-- CreateTable
CREATE TABLE "UserSchedule" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "daysOfWeek" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "weekOfMonth" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "startTime" TIME NOT NULL,
    "endTime" TIME NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'base',
    "pattern" TEXT NOT NULL DEFAULT 'weekly',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "UserSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_schedule_index" ON "UserSchedule"("userId", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "UserSchedule" ADD CONSTRAINT "UserSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
