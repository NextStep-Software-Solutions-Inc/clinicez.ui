-- AlterTable
ALTER TABLE "HealthcareProvider" ADD COLUMN     "userPlanId" INTEGER;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "description" TEXT,
ADD COLUMN     "userPlanId" INTEGER;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
