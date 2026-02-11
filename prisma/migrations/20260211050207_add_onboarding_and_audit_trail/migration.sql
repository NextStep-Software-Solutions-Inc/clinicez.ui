-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'ONBOARDING_START', 'ONBOARDING_COMPLETE', 'PERMISSION_GRANT', 'PERMISSION_REVOKE');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'CLINIC_PATIENT', 'ORGANIZATION_MEMBER', 'CLINIC_MEMBER', 'PERMISSION', 'APPOINTMENT', 'CONSULTATION', 'PRESCRIPTION', 'OTHER');

-- AlterTable: Add onboarding fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompletionDate" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isShellAccount" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shellAccountCreatedBy" INTEGER;

-- AlterTable: Add onboarding fields to ClinicPatient
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "onboardingCompletionDate" TIMESTAMP(3);
ALTER TABLE "ClinicPatient" ADD COLUMN IF NOT EXISTS "addedBy" INTEGER;

-- AlterTable: Add onboarding fields to OrganizationMember
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "onboardingStatus" "OnboardingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "OrganizationMember" ADD COLUMN IF NOT EXISTS "onboardingCompletionDate" TIMESTAMP(3);

-- CreateTable: OnboardingStep
CREATE TABLE IF NOT EXISTS "OnboardingStep" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stepType" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "status" "OnboardingStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,

    CONSTRAINT "OnboardingStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable: AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER,
    "actionType" "AuditActionType" NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" INTEGER,
    "targetUserId" INTEGER,
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OnboardingStep_userId_status_idx" ON "OnboardingStep"("userId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_targetUserId_idx" ON "AuditLog"("targetUserId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT IF NOT EXISTS "User_shellAccountCreatedBy_fkey" FOREIGN KEY ("shellAccountCreatedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OnboardingStep" ADD CONSTRAINT "OnboardingStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
