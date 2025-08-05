/*
  Warnings:

  - You are about to drop the column `reasonId` on the `ClinicReferralSlip` table. All the data in the column will be lost.
  - You are about to drop the column `referredToId` on the `ClinicReferralSlip` table. All the data in the column will be lost.

*/

-- Add new text columns first
ALTER TABLE "ClinicReferralSlip" 
ADD COLUMN "pinCode" TEXT,
ADD COLUMN "reasonText" TEXT,
ADD COLUMN "referredToText" TEXT;

-- Migrate existing data from foreign key relations to text fields
UPDATE "ClinicReferralSlip" 
SET "reasonText" = (SELECT "name" FROM "ReferralReason" WHERE "id" = "ClinicReferralSlip"."reasonId")
WHERE "reasonId" IS NOT NULL;

UPDATE "ClinicReferralSlip" 
SET "referredToText" = (SELECT "name" FROM "HPProfile" WHERE "healthcareProviderId" = "ClinicReferralSlip"."referredToId")
WHERE "referredToId" IS NOT NULL;

-- Drop foreign key constraints
ALTER TABLE "ClinicReferralSlip" DROP CONSTRAINT "ClinicReferralSlip_reasonId_fkey";
ALTER TABLE "ClinicReferralSlip" DROP CONSTRAINT "ClinicReferralSlip_referredToId_fkey";

-- Drop the old foreign key columns
ALTER TABLE "ClinicReferralSlip" 
DROP COLUMN "reasonId",
DROP COLUMN "referredToId";
