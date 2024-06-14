-- AlterEnum
ALTER TYPE "UserPlanStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "HealthcareProvider" ADD COLUMN     "isPublished" BOOLEAN NOT NULL DEFAULT false;
