-- AlterEnum
ALTER TYPE "BloodType" ADD VALUE 'UNKNOWN';

-- CreateTable
CREATE TABLE "TenantSetting" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "onPremise" BOOLEAN NOT NULL DEFAULT false,
    "storageConnectionString" TEXT,
    "dbConnectionString" TEXT,

    CONSTRAINT "TenantSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSetting" (
    "id" SERIAL NOT NULL,
    "orgId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sendEmailNotification" BOOLEAN NOT NULL DEFAULT true,
    "emailToOrgOnly" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrganizationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantSetting_tenantId_key" ON "TenantSetting"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSetting_orgId_key" ON "OrganizationSetting"("orgId");

-- AddForeignKey
ALTER TABLE "TenantSetting" ADD CONSTRAINT "TenantSetting_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "OrganizationSetting" ADD CONSTRAINT "OrganizationSetting_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
