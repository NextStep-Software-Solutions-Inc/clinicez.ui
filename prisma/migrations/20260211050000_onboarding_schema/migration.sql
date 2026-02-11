-- AlterTable: Add onboarding fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompletionStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'FULL';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstLogin" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "claimedBy" INTEGER;

-- AddForeignKey: User.claimedBy -> User.id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'User_claimedBy_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_claimedBy_fkey" FOREIGN KEY ("claimedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
    END IF;
END $$;

-- AlterTable: Add onboarding fields to ClinicPatient
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "onboardingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "profileCompletionStatus" TEXT NOT NULL DEFAULT 'INCOMPLETE';
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "accountType" TEXT NOT NULL DEFAULT 'FULL';
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "claimedAt" TIMESTAMP(3);
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "claimedBy" INTEGER;

-- CreateTable: OnboardingStep
CREATE TABLE IF NOT EXISTS "OnboardingStep" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'USER',
    "entityId" INTEGER,
    "stepName" TEXT NOT NULL,
    "stepLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: OnboardingStep
CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingStep_userId_entityType_entityId_stepName_key" ON "OnboardingStep"("userId", "entityType", "entityId", "stepName");
CREATE INDEX IF NOT EXISTS "OnboardingStep_userId_idx" ON "OnboardingStep"("userId");
CREATE INDEX IF NOT EXISTS "OnboardingStep_entityType_entityId_idx" ON "OnboardingStep"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "OnboardingStep_status_idx" ON "OnboardingStep"("status");

-- AddForeignKey: OnboardingStep.userId -> User.id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'OnboardingStep_userId_fkey') THEN
        ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- CreateTable: OnboardingStepLog
CREATE TABLE IF NOT EXISTS "OnboardingStepLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'USER',
    "entityId" INTEGER,
    "action" TEXT NOT NULL,
    "stepName" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "metadata" TEXT,
    "performedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingStepLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: OnboardingStepLog
CREATE INDEX IF NOT EXISTS "OnboardingStepLog_userId_idx" ON "OnboardingStepLog"("userId");
CREATE INDEX IF NOT EXISTS "OnboardingStepLog_entityType_entityId_idx" ON "OnboardingStepLog"("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "OnboardingStepLog_createdAt_idx" ON "OnboardingStepLog"("createdAt");

-- AddForeignKey: OnboardingStepLog.userId -> User.id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'OnboardingStepLog_userId_fkey') THEN
        ALTER TABLE "OnboardingStepLog" ADD CONSTRAINT "OnboardingStepLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- CreateTable: OrgOnboardingRequirement
CREATE TABLE IF NOT EXISTS "OrgOnboardingRequirement" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "entityType" TEXT NOT NULL DEFAULT 'USER',
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgOnboardingRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: OrgOnboardingRequirement
CREATE UNIQUE INDEX IF NOT EXISTS "OrgOnboardingRequirement_organizationId_entityType_fieldName_key" ON "OrgOnboardingRequirement"("organizationId", "entityType", "fieldName");
CREATE INDEX IF NOT EXISTS "OrgOnboardingRequirement_organizationId_idx" ON "OrgOnboardingRequirement"("organizationId");

-- AddForeignKey: OrgOnboardingRequirement.organizationId -> Organization.id
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'OrgOnboardingRequirement_organizationId_fkey') THEN
        ALTER TABLE "OrgOnboardingRequirement" ADD CONSTRAINT "OrgOnboardingRequirement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
    END IF;
END $$;

-- Data migration: Set existing users with completed profiles to COMPLETED onboarding
-- Users who have firstName, lastName, email, and dob filled in are considered complete
UPDATE "User"
SET "onboardingStatus" = 'COMPLETED',
    "profileCompletionStatus" = 'COMPLETE',
    "onboardingCompletedAt" = "createdAt"
WHERE "firstName" IS NOT NULL
  AND "lastName" IS NOT NULL
  AND "email" IS NOT NULL
  AND "dob" IS NOT NULL
  AND "onboardingStatus" = 'NOT_STARTED';

-- Users who have partial profile data are set to IN_PROGRESS
UPDATE "User"
SET "onboardingStatus" = 'IN_PROGRESS',
    "profileCompletionStatus" = 'PARTIAL'
WHERE ("firstName" IS NOT NULL OR "lastName" IS NOT NULL)
  AND "onboardingStatus" = 'NOT_STARTED';

-- Data migration: Set existing clinic patients with active status to COMPLETED
UPDATE "ClinicPatient"
SET "onboardingStatus" = 'COMPLETED',
    "profileCompletionStatus" = 'COMPLETE'
WHERE "isActive" = true
  AND "onboardingStatus" = 'NOT_STARTED';
