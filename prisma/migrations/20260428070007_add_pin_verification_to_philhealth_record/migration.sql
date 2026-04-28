-- AlterTable
ALTER TABLE "PhilHealthRecord" ADD COLUMN     "pinVerificationResult" JSONB,
ADD COLUMN     "pinVerificationStatus" TEXT,
ADD COLUMN     "pinVerifiedAt" TIMESTAMP(3);
