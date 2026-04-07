-- CreateEnum
CREATE TYPE "HPApplicationStatus" AS ENUM ('PENDING_PROFILE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable: make HPProfile.title nullable
ALTER TABLE "HPProfile" ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable: add applicationStatus to HealthcareProvider
ALTER TABLE "HealthcareProvider" ADD COLUMN "applicationStatus" "HPApplicationStatus" NOT NULL DEFAULT 'PENDING_PROFILE';
