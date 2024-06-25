-- DropForeignKey
ALTER TABLE "DoctorProfile" DROP CONSTRAINT "DoctorProfile_healthcareProviderId_fkey";

-- DropForeignKey
ALTER TABLE "Feature" DROP CONSTRAINT "Feature_planId_fkey";

-- DropForeignKey
ALTER TABLE "HealthcareProvider" DROP CONSTRAINT "HealthcareProvider_userId_fkey";

-- DropForeignKey
ALTER TABLE "NurseProfile" DROP CONSTRAINT "NurseProfile_healthcareProviderId_fkey";

-- DropForeignKey
ALTER TABLE "Organization" DROP CONSTRAINT "Organization_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "ProfessionalDetails" DROP CONSTRAINT "ProfessionalDetails_healthcareProverId_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptCodeClaim" DROP CONSTRAINT "ReceiptCodeClaim_receiptCodeId_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptCodeClaim" DROP CONSTRAINT "ReceiptCodeClaim_userId_fkey";

-- DropForeignKey
ALTER TABLE "SocialLink" DROP CONSTRAINT "SocialLink_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganization" DROP CONSTRAINT "UserDefaultOrganization_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultOrganization" DROP CONSTRAINT "UserDefaultOrganization_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultTenant" DROP CONSTRAINT "UserDefaultTenant_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "UserDefaultTenant" DROP CONSTRAINT "UserDefaultTenant_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_acceptedBy_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_role_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganization" DROP CONSTRAINT "UserOrganization_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserOrganizationRole" DROP CONSTRAINT "UserOrganizationRole_orgId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlan" DROP CONSTRAINT "UserPlan_planId_fkey";

-- DropForeignKey
ALTER TABLE "UserPlan" DROP CONSTRAINT "UserPlan_userId_fkey";

-- CreateTable
CREATE TABLE "UserMigration" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "orgId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserMigration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivationCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ActivationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMigration_userId_key" ON "UserMigration"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserMigration_userId_orgId_key" ON "UserMigration"("userId", "orgId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivationCode_code_key" ON "ActivationCode"("code");

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_role_fkey" FOREIGN KEY ("role") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserOrganizationRole" ADD CONSTRAINT "UserOrganizationRole_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Feature" ADD CONSTRAINT "Feature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserPlan" ADD CONSTRAINT "UserPlan_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "DoctorProfile" ADD CONSTRAINT "DoctorProfile_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "NurseProfile" ADD CONSTRAINT "NurseProfile_healthcareProviderId_fkey" FOREIGN KEY ("healthcareProviderId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ProfessionalDetails" ADD CONSTRAINT "ProfessionalDetails_healthcareProverId_fkey" FOREIGN KEY ("healthcareProverId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganization" ADD CONSTRAINT "UserDefaultOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultOrganization" ADD CONSTRAINT "UserDefaultOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultTenant" ADD CONSTRAINT "UserDefaultTenant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultTenant" ADD CONSTRAINT "UserDefaultTenant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SocialLink" ADD CONSTRAINT "SocialLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReceiptCodeClaim" ADD CONSTRAINT "ReceiptCodeClaim_receiptCodeId_fkey" FOREIGN KEY ("receiptCodeId") REFERENCES "ReceiptCode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserMigration" ADD CONSTRAINT "UserMigration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserMigration" ADD CONSTRAINT "UserMigration_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivationCode" ADD CONSTRAINT "ActivationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
