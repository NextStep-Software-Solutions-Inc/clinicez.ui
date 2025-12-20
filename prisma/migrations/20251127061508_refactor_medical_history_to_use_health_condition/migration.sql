-- CreateTable
CREATE TABLE "public"."MedicalHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "conditionId" INTEGER NOT NULL,
    "details" TEXT,
    "highestBpSystolic" INTEGER,
    "highestBpDiastolic" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FamilyMedicalHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "hasAllergy" BOOLEAN NOT NULL DEFAULT false,
    "allergyDetails" TEXT,
    "hasAsthma" BOOLEAN NOT NULL DEFAULT false,
    "hasCancer" BOOLEAN NOT NULL DEFAULT false,
    "cancerOrgan" TEXT,
    "hasCerebrovascularDisease" BOOLEAN NOT NULL DEFAULT false,
    "hasCoronaryArteryDisease" BOOLEAN NOT NULL DEFAULT false,
    "hasDiabetesMellitus" BOOLEAN NOT NULL DEFAULT false,
    "hasEmphysema" BOOLEAN NOT NULL DEFAULT false,
    "hasEpilepsy" BOOLEAN NOT NULL DEFAULT false,
    "hasHepatitis" BOOLEAN NOT NULL DEFAULT false,
    "hepatitisType" TEXT,
    "hasHyperlipidemia" BOOLEAN NOT NULL DEFAULT false,
    "hasHypertension" BOOLEAN NOT NULL DEFAULT false,
    "highestBpSystolic" INTEGER,
    "highestBpDiastolic" INTEGER,
    "hasPepticUlcer" BOOLEAN NOT NULL DEFAULT false,
    "hasPneumonia" BOOLEAN NOT NULL DEFAULT false,
    "hasThyroidDisease" BOOLEAN NOT NULL DEFAULT false,
    "hasPulmonaryTuberculosis" BOOLEAN NOT NULL DEFAULT false,
    "pulmonaryTBDetails" TEXT,
    "hasExtrapulmonaryTuberculosis" BOOLEAN NOT NULL DEFAULT false,
    "extrapulmonaryTBDetails" TEXT,
    "hasUrinaryTractInfection" BOOLEAN NOT NULL DEFAULT false,
    "hasMentalIllness" BOOLEAN NOT NULL DEFAULT false,
    "hasOtherConditions" BOOLEAN NOT NULL DEFAULT false,
    "otherConditionsDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FamilyMedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SurgicalHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "operationName" TEXT NOT NULL,
    "operationDate" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SurgicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PersonalHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "smokingStatus" TEXT,
    "numberOfPacksPerYear" INTEGER,
    "alcoholStatus" TEXT,
    "numberOfBottlesPerDay" INTEGER,
    "illicitDrugUse" TEXT,
    "sexuallyActive" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PersonalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ObGyneHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "menarche" INTEGER,
    "lastMenstrualPeriod" DATE,
    "menopauseAge" INTEGER,
    "menopauseStatus" TEXT,
    "ageAtFirstSexualIntercourse" INTEGER,
    "birthControlMethod" TEXT,
    "menstrualPeriodDuration" INTEGER,
    "menstrualCycleInterval" INTEGER,
    "numberOfPadsPerDay" INTEGER,
    "gravidity" INTEGER,
    "parity" INTEGER,
    "fullTerm" INTEGER,
    "premature" INTEGER,
    "abortion" INTEGER,
    "livingChildren" INTEGER,
    "typeOfDelivery" TEXT,
    "hasPreEclampsia" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ObGyneHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PhysicalExamination" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "vitalSignId" INTEGER,
    "visualAcuityLeft" TEXT,
    "visualAcuityRight" TEXT,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PhysicalExamination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PediatricMeasurement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "dateTaken" DATE NOT NULL,
    "length" DECIMAL(5,2),
    "headCircumference" DECIMAL(5,2),
    "skinfoldThickness" DECIMAL(5,2),
    "waistCircumference" DECIMAL(5,2),
    "hipCircumference" DECIMAL(5,2),
    "limbCircumference" DECIMAL(5,2),
    "midUpperArmCircumference" DECIMAL(5,2),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PediatricMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MedicalHistory_userId_idx" ON "public"."MedicalHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalHistory_userId_conditionId_key" ON "public"."MedicalHistory"("userId", "conditionId");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyMedicalHistory_userId_key" ON "public"."FamilyMedicalHistory"("userId");

-- CreateIndex
CREATE INDEX "SurgicalHistory_userId_idx" ON "public"."SurgicalHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalHistory_userId_key" ON "public"."PersonalHistory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ObGyneHistory_userId_key" ON "public"."ObGyneHistory"("userId");

-- CreateIndex
CREATE INDEX "PhysicalExamination_userId_idx" ON "public"."PhysicalExamination"("userId");

-- CreateIndex
CREATE INDEX "PhysicalExamination_vitalSignId_idx" ON "public"."PhysicalExamination"("vitalSignId");

-- CreateIndex
CREATE INDEX "PediatricMeasurement_userId_dateTaken_idx" ON "public"."PediatricMeasurement"("userId", "dateTaken");

-- AddForeignKey
ALTER TABLE "public"."MedicalHistory" ADD CONSTRAINT "MedicalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MedicalHistory" ADD CONSTRAINT "MedicalHistory_conditionId_fkey" FOREIGN KEY ("conditionId") REFERENCES "public"."HealthCondition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FamilyMedicalHistory" ADD CONSTRAINT "FamilyMedicalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SurgicalHistory" ADD CONSTRAINT "SurgicalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PersonalHistory" ADD CONSTRAINT "PersonalHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ObGyneHistory" ADD CONSTRAINT "ObGyneHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhysicalExamination" ADD CONSTRAINT "PhysicalExamination_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PhysicalExamination" ADD CONSTRAINT "PhysicalExamination_vitalSignId_fkey" FOREIGN KEY ("vitalSignId") REFERENCES "public"."VitalSign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PediatricMeasurement" ADD CONSTRAINT "PediatricMeasurement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
