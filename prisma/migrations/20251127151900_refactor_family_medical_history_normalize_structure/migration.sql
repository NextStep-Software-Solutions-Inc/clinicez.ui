/*
  Warnings:

  - You are about to drop the column `allergyDetails` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `cancerOrgan` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `extrapulmonaryTBDetails` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasAllergy` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasAsthma` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasCancer` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasCerebrovascularDisease` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasCoronaryArteryDisease` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasDiabetesMellitus` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasEmphysema` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasEpilepsy` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasExtrapulmonaryTuberculosis` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasHepatitis` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasHyperlipidemia` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasHypertension` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasMentalIllness` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasOtherConditions` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasPepticUlcer` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasPneumonia` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasPulmonaryTuberculosis` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasThyroidDisease` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hasUrinaryTractInfection` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `hepatitisType` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `highestBpDiastolic` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `highestBpSystolic` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `otherConditionsDetails` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `pulmonaryTBDetails` on the `FamilyMedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `highestBpDiastolic` on the `MedicalHistory` table. All the data in the column will be lost.
  - You are about to drop the column `highestBpSystolic` on the `MedicalHistory` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,conditionId]` on the table `FamilyMedicalHistory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `conditionId` to the `FamilyMedicalHistory` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Create a temporary table to store the new normalized data
CREATE TEMP TABLE temp_family_medical_history AS
SELECT 
  fmh.id,
  fmh."userId",
  fmh."createdAt",
  fmh."updatedAt",
  fmh."deletedAt",
  hc.id as "conditionId",
  CASE 
    WHEN hc.name = 'Allergy' THEN fmh."allergyDetails"
    WHEN hc.name = 'Cancer' THEN fmh."cancerOrgan"
    WHEN hc.name = 'Hepatitis' THEN fmh."hepatitisType"
    WHEN hc.name = 'Pulmonary Tuberculosis' THEN fmh."pulmonaryTBDetails"
    WHEN hc.name = 'Extrapulmonary Tuberculosis' THEN fmh."extrapulmonaryTBDetails"
    WHEN hc.name = 'Others' THEN fmh."otherConditionsDetails"
    ELSE NULL
  END as details
FROM "public"."FamilyMedicalHistory" fmh
CROSS JOIN "public"."HealthCondition" hc
WHERE 
  (hc.name = 'Allergy' AND fmh."hasAllergy" = true)
  OR (hc.name = 'Asthma' AND fmh."hasAsthma" = true)
  OR (hc.name = 'Cancer' AND fmh."hasCancer" = true)
  OR (hc.name = 'Cerebrovascular Disease' AND fmh."hasCerebrovascularDisease" = true)
  OR (hc.name = 'Coronary Artery Disease' AND fmh."hasCoronaryArteryDisease" = true)
  OR (hc.name = 'Diabetes Mellitus' AND fmh."hasDiabetesMellitus" = true)
  OR (hc.name = 'Emphysema' AND fmh."hasEmphysema" = true)
  OR (hc.name = 'Epilepsy' AND fmh."hasEpilepsy" = true)
  OR (hc.name = 'Hepatitis' AND fmh."hasHepatitis" = true)
  OR (hc.name = 'Hyperlipidemia' AND fmh."hasHyperlipidemia" = true)
  OR (hc.name = 'Hypertension' AND fmh."hasHypertension" = true)
  OR (hc.name = 'Peptic Ulcer' AND fmh."hasPepticUlcer" = true)
  OR (hc.name = 'Pneumonia' AND fmh."hasPneumonia" = true)
  OR (hc.name = 'Thyroid Disease' AND fmh."hasThyroidDisease" = true)
  OR (hc.name = 'Pulmonary Tuberculosis' AND fmh."hasPulmonaryTuberculosis" = true)
  OR (hc.name = 'Extrapulmonary Tuberculosis' AND fmh."hasExtrapulmonaryTuberculosis" = true)
  OR (hc.name = 'Urinary Tract Infection' AND fmh."hasUrinaryTractInfection" = true)
  OR (hc.name = 'Mental Illness' AND fmh."hasMentalIllness" = true)
  OR (hc.name = 'Others' AND fmh."hasOtherConditions" = true);

-- Step 2: Delete all existing rows in FamilyMedicalHistory
DELETE FROM "public"."FamilyMedicalHistory";

-- Step 3: Drop the unique constraint on userId
DROP INDEX "public"."FamilyMedicalHistory_userId_key";

-- Step 4: Alter table structure
ALTER TABLE "public"."FamilyMedicalHistory" DROP COLUMN "allergyDetails",
DROP COLUMN "cancerOrgan",
DROP COLUMN "extrapulmonaryTBDetails",
DROP COLUMN "hasAllergy",
DROP COLUMN "hasAsthma",
DROP COLUMN "hasCancer",
DROP COLUMN "hasCerebrovascularDisease",
DROP COLUMN "hasCoronaryArteryDisease",
DROP COLUMN "hasDiabetesMellitus",
DROP COLUMN "hasEmphysema",
DROP COLUMN "hasEpilepsy",
DROP COLUMN "hasExtrapulmonaryTuberculosis",
DROP COLUMN "hasHepatitis",
DROP COLUMN "hasHyperlipidemia",
DROP COLUMN "hasHypertension",
DROP COLUMN "hasMentalIllness",
DROP COLUMN "hasOtherConditions",
DROP COLUMN "hasPepticUlcer",
DROP COLUMN "hasPneumonia",
DROP COLUMN "hasPulmonaryTuberculosis",
DROP COLUMN "hasThyroidDisease",
DROP COLUMN "hasUrinaryTractInfection",
DROP COLUMN "hepatitisType",
DROP COLUMN "highestBpDiastolic",
DROP COLUMN "highestBpSystolic",
DROP COLUMN "otherConditionsDetails",
DROP COLUMN "pulmonaryTBDetails",
ADD COLUMN     "conditionId" INTEGER NOT NULL,
ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "public"."MedicalHistory" DROP COLUMN "highestBpDiastolic",
DROP COLUMN "highestBpSystolic";

-- Step 5: Create indexes before inserting data
CREATE INDEX "FamilyMedicalHistory_userId_idx" ON "public"."FamilyMedicalHistory"("userId");
CREATE UNIQUE INDEX "FamilyMedicalHistory_userId_conditionId_key" ON "public"."FamilyMedicalHistory"("userId", "conditionId");

-- Step 6: Add foreign key constraint
ALTER TABLE "public"."FamilyMedicalHistory" ADD CONSTRAINT "FamilyMedicalHistory_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "public"."HealthCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 7: Insert the migrated data back into FamilyMedicalHistory
INSERT INTO "public"."FamilyMedicalHistory" ("userId", "conditionId", "details", "createdAt", "updatedAt", "deletedAt")
SELECT DISTINCT ON ("userId", "conditionId")
  "userId",
  "conditionId",
  details,
  "createdAt",
  "updatedAt",
  "deletedAt"
FROM temp_family_medical_history
ORDER BY "userId", "conditionId", id;

-- Step 8: Drop the temporary table
DROP TABLE IF EXISTS temp_family_medical_history;
