-- AlterTable
ALTER TABLE "UserDisability" ADD COLUMN     "diagnosedBy" INTEGER;

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_diagnosedBy_fkey" FOREIGN KEY ("diagnosedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
