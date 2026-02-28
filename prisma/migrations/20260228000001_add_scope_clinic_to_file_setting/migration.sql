-- AlterTable
ALTER TABLE "FileSetting" ADD COLUMN "scopeClinicId" INTEGER;

-- AddForeignKey
ALTER TABLE "FileSetting" ADD CONSTRAINT "FileSetting_scopeClinicId_fkey" FOREIGN KEY ("scopeClinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
