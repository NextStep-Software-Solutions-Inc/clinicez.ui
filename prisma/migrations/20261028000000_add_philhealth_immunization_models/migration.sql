-- CreateEnum (idempotent)
DO $$
BEGIN
    CREATE TYPE "ImmunizationCategory" AS ENUM ('CHILD', 'YOUNG_WOMAN', 'PREGNANT', 'ELDERLY', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable
ALTER TABLE "PhilHealthKonsultaEnlistment" ADD COLUMN IF NOT EXISTS "enlistmentDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PhilHealthImmunizationLibrary" (
    "id" SERIAL NOT NULL,
    "category" "ImmunizationCategory" NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "doseNumber" INTEGER,
    "defaultDoseLabel" TEXT,
    "targetGender" TEXT,
    "minAgeMonths" INTEGER,
    "maxAgeMonths" INTEGER,
    "defaultRoute" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhilHealthImmunizationLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PatientImmunization" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "immunizationLibId" INTEGER,
    "category" "ImmunizationCategory" NOT NULL,
    "code" TEXT,
    "vaccineName" TEXT NOT NULL,
    "doseNumber" TEXT NOT NULL,
    "route" TEXT,
    "dateGiven" TIMESTAMP(3) NOT NULL,
    "administeredBy" TEXT,
    "facilityName" TEXT,
    "lotNumber" TEXT,
    "expirationDate" TIMESTAMP(3),
    "notes" TEXT,
    "reportStatus" TEXT NOT NULL DEFAULT 'U',
    "deficiencyRemarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PatientImmunization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PhilHealthImmunizationLibrary_category_isActive_idx" ON "PhilHealthImmunizationLibrary"("category", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PhilHealthImmunizationLibrary_category_code_key" ON "PhilHealthImmunizationLibrary"("category", "code");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PatientImmunization_userId_isActive_idx" ON "PatientImmunization"("userId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PatientImmunization_category_code_idx" ON "PatientImmunization"("category", "code");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PatientImmunization_userId_fkey'
    ) THEN
        ALTER TABLE "PatientImmunization"
            ADD CONSTRAINT "PatientImmunization_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'PatientImmunization_immunizationLibId_fkey'
    ) THEN
        ALTER TABLE "PatientImmunization"
            ADD CONSTRAINT "PatientImmunization_immunizationLibId_fkey"
            FOREIGN KEY ("immunizationLibId") REFERENCES "PhilHealthImmunizationLibrary"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- Seed official PhilHealth Konsulta v1.1 Immunization Reference Library (22 records)
INSERT INTO "PhilHealthImmunizationLibrary" (
    "category", "code", "name", "description", "doseNumber", "defaultDoseLabel",
    "targetGender", "minAgeMonths", "maxAgeMonths", "defaultRoute", "isActive", "sortOrder", "updatedAt"
) VALUES
    -- CHILD (0 - 59 months)
    ('CHILD'::"ImmunizationCategory", 'C01', 'BCG', 'Bacillus Calmette-Guérin Vaccine', 1, '1st Dose', NULL, 0, 59, 'Intradermal', true, 1, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C02', 'OPV', 'Oral Polio Vaccine 1', 1, '1st Dose', NULL, 0, 59, 'Oral', true, 2, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C03', 'OPV', 'Oral Polio Vaccine 2', 2, '2nd Dose', NULL, 0, 59, 'Oral', true, 3, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C04', 'OPV', 'Oral Polio Vaccine 3', 3, '3rd Dose', NULL, 0, 59, 'Oral', true, 4, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C05', 'DPT', 'Diphtheria, Pertussis, Tetanus Vaccine 1', 1, '1st Dose', NULL, 0, 59, 'Intramuscular', true, 5, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C06', 'DPT', 'Diphtheria, Pertussis, Tetanus Vaccine 2', 2, '2nd Dose', NULL, 0, 59, 'Intramuscular', true, 6, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C07', 'DPT', 'Diphtheria, Pertussis, Tetanus Vaccine 3', 3, '3rd Dose', NULL, 0, 59, 'Intramuscular', true, 7, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C08', 'Measles', 'Measles Vaccine', 1, '1st Dose', NULL, 0, 59, 'Subcutaneous', true, 8, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C09', 'Hepatitis B', 'Hepatitis B Vaccine 1', 1, '1st Dose', NULL, 0, 59, 'Intramuscular', true, 9, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C10', 'Hepatitis B', 'Hepatitis B Vaccine 2', 2, '2nd Dose', NULL, 0, 59, 'Intramuscular', true, 10, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C11', 'Hepatitis B', 'Hepatitis B Vaccine 3', 3, '3rd Dose', NULL, 0, 59, 'Intramuscular', true, 11, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C12', 'Hepatitis A', 'Hepatitis A Vaccine', 1, '1st Dose', NULL, 0, 59, 'Intramuscular', true, 12, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", 'C13', 'Varicella', 'Varicella (Chicken Pox) Vaccine', 1, '1st Dose', NULL, 0, 59, 'Subcutaneous', true, 13, CURRENT_TIMESTAMP),
    ('CHILD'::"ImmunizationCategory", '999', 'None', 'No Child Immunizations Given', NULL, NULL, NULL, 0, 59, NULL, true, 99, CURRENT_TIMESTAMP),
    -- YOUNG_WOMAN (10 - 49 years)
    ('YOUNG_WOMAN'::"ImmunizationCategory", 'Y01', 'HPV', 'Human Papillomavirus Vaccine', NULL, '1st Dose', 'F', 120, 588, 'Intramuscular', true, 1, CURRENT_TIMESTAMP),
    ('YOUNG_WOMAN'::"ImmunizationCategory", 'Y02', 'MMR', 'Measles, Mumps, Rubella Vaccine', NULL, '1st Dose', 'F', 120, 588, 'Subcutaneous', true, 2, CURRENT_TIMESTAMP),
    ('YOUNG_WOMAN'::"ImmunizationCategory", '999', 'None', 'No Young Woman Immunizations Given', NULL, NULL, 'F', 120, 588, NULL, true, 99, CURRENT_TIMESTAMP),
    -- PREGNANT
    ('PREGNANT'::"ImmunizationCategory", 'P01', 'Tetanus Toxoid', 'Tetanus Toxoid Vaccine', NULL, '1st Dose', 'F', NULL, NULL, 'Intramuscular', true, 1, CURRENT_TIMESTAMP),
    ('PREGNANT'::"ImmunizationCategory", '999', 'None', 'No Pregnant Woman Immunizations Given', NULL, NULL, 'F', NULL, NULL, NULL, true, 99, CURRENT_TIMESTAMP),
    -- ELDERLY (>= 60 years)
    ('ELDERLY'::"ImmunizationCategory", 'E01', 'Pneumococcal Vaccine', 'Pneumococcal Polysaccharide Vaccine', NULL, '1st Dose', NULL, 720, NULL, 'Intramuscular', true, 1, CURRENT_TIMESTAMP),
    ('ELDERLY'::"ImmunizationCategory", 'E02', 'Flu Vaccine', 'Influenza Vaccine', NULL, 'Annual Dose', NULL, 720, NULL, 'Intramuscular', true, 2, CURRENT_TIMESTAMP),
    ('ELDERLY'::"ImmunizationCategory", '999', 'None', 'No Elderly Immunizations Given', NULL, NULL, NULL, 720, NULL, NULL, true, 99, CURRENT_TIMESTAMP)
ON CONFLICT ("category", "code") DO UPDATE SET
    "name" = EXCLUDED."name",
    "description" = EXCLUDED."description",
    "doseNumber" = EXCLUDED."doseNumber",
    "defaultDoseLabel" = EXCLUDED."defaultDoseLabel",
    "targetGender" = EXCLUDED."targetGender",
    "minAgeMonths" = EXCLUDED."minAgeMonths",
    "maxAgeMonths" = EXCLUDED."maxAgeMonths",
    "defaultRoute" = EXCLUDED."defaultRoute",
    "isActive" = EXCLUDED."isActive",
    "sortOrder" = EXCLUDED."sortOrder",
    "updatedAt" = CURRENT_TIMESTAMP;
