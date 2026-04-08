-- CreateEnum
CREATE TYPE "HPApplicationStatus" AS ENUM ('PENDING_PROFILE', 'PROFILE_COMPLETE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "HPProfile" ALTER COLUMN "title" DROP NOT NULL;

-- AlterTable
ALTER TABLE "HealthcareProvider" ADD COLUMN     "applicationStatus" "HPApplicationStatus" NOT NULL DEFAULT 'PENDING_PROFILE';
