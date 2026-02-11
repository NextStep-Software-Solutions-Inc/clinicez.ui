-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "ProfileCompletionStatus" AS ENUM ('INCOMPLETE', 'PARTIAL', 'COMPLETE');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('FULL', 'SHELL');

-- CreateEnum
CREATE TYPE "OnboardingStepStatus" AS ENUM ('PENDING', 'COMPLETED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "OnboardingEntityType" AS ENUM ('USER', 'PATIENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE', 'STATUS_CHANGE', 'ONBOARDING', 'JOIN', 'LEAVE', 'CLAIM');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'PATIENT', 'ORGANIZATION', 'CLINIC', 'PERMISSION', 'CLINIC_MEMBER', 'ORG_MEMBER', 'PROVIDER', 'ONBOARDING');

-- AlterTable
ALTER TABLE "ClinicPatient" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedBy" INTEGER,
ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "profileCompletionStatus" "ProfileCompletionStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'FULL',
ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "claimedBy" INTEGER,
ADD COLUMN     "firstLogin" TIMESTAMP(3),
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN     "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN     "profileCompletionStatus" "ProfileCompletionStatus" NOT NULL DEFAULT 'INCOMPLETE';

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" "AuditAction" NOT NULL,
    "fieldName" TEXT,
    "previousValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "metadata" JSONB,
    "performedBy" INTEGER,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStep" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityType" "OnboardingEntityType" NOT NULL DEFAULT 'USER',
    "entityId" INTEGER,
    "stepName" TEXT NOT NULL,
    "stepLabel" TEXT,
    "status" "OnboardingStepStatus" NOT NULL DEFAULT 'PENDING',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingStepLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entityType" "OnboardingEntityType" NOT NULL DEFAULT 'USER',
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

-- CreateTable
CREATE TABLE "OrgOnboardingRequirement" (
    "id" SERIAL NOT NULL,
    "organizationId" INTEGER NOT NULL,
    "entityType" "OnboardingEntityType" NOT NULL DEFAULT 'USER',
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgOnboardingRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_performedBy_idx" ON "AuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "AuditLog_performedAt_idx" ON "AuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_fieldName_idx" ON "AuditLog"("entityType", "entityId", "fieldName");

-- CreateIndex
CREATE INDEX "OnboardingStep_userId_idx" ON "OnboardingStep"("userId");

-- CreateIndex
CREATE INDEX "OnboardingStep_entityType_entityId_idx" ON "OnboardingStep"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "OnboardingStep_status_idx" ON "OnboardingStep"("status");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingStep_userId_entityType_entityId_stepName_key" ON "OnboardingStep"("userId", "entityType", "entityId", "stepName");

-- CreateIndex
CREATE INDEX "OnboardingStepLog_userId_idx" ON "OnboardingStepLog"("userId");

-- CreateIndex
CREATE INDEX "OnboardingStepLog_entityType_entityId_idx" ON "OnboardingStepLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "OnboardingStepLog_createdAt_idx" ON "OnboardingStepLog"("createdAt");

-- CreateIndex
CREATE INDEX "OrgOnboardingRequirement_organizationId_idx" ON "OrgOnboardingRequirement"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "OrgOnboardingRequirement_organizationId_entityType_fieldNam_key" ON "OrgOnboardingRequirement"("organizationId", "entityType", "fieldName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_claimedBy_fkey" FOREIGN KEY ("claimedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OnboardingStepLog" ADD CONSTRAINT "OnboardingStepLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrgOnboardingRequirement" ADD CONSTRAINT "OrgOnboardingRequirement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
