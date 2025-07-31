/*
  Warnings:

  - You are about to drop the column `reasonText` on the `ClinicReferralSlip` table. All the data in the column will be lost.
  - You are about to drop the column `referredToText` on the `ClinicReferralSlip` table. All the data in the column will be lost.

*/

-- Add new columns
ALTER TABLE "ClinicReferralSlip" 
ADD COLUMN "reason" TEXT,
ADD COLUMN "referredTo" TEXT;

-- Copy data from old columns to new columns
UPDATE "ClinicReferralSlip" 
SET "reason" = "reasonText"
WHERE "reasonText" IS NOT NULL;

UPDATE "ClinicReferralSlip" 
SET "referredTo" = "referredToText"
WHERE "referredToText" IS NOT NULL;

-- Drop the old columns
ALTER TABLE "ClinicReferralSlip" 
DROP COLUMN "reasonText",
DROP COLUMN "referredToText";
