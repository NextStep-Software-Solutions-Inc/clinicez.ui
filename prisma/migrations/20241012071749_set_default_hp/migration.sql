-- AlterTable
ALTER TABLE "UserPreference" ADD COLUMN     "defaultHpId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserPreference" ADD CONSTRAINT "UserPreference_defaultHpId_fkey" FOREIGN KEY ("defaultHpId") REFERENCES "HealthcareProvider"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
