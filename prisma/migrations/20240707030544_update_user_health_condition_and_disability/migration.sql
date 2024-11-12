-- CreateEnum
CREATE TYPE "HealthConditionStatus" AS ENUM ('RESOLVED', 'UNRESOLVED');

-- AlterTable
ALTER TABLE "UserDisability" ADD COLUMN     "isManaged" BOOLEAN DEFAULT false,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "UserHealthCondition" ADD COLUMN     "dateResolved" TIMESTAMP(3),
ADD COLUMN     "diagnosedBy" INTEGER,
ADD COLUMN     "resolvedBy" INTEGER,
ADD COLUMN     "status" "HealthConditionStatus" DEFAULT 'UNRESOLVED';

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_diagnosedBy_fkey" FOREIGN KEY ("diagnosedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserHealthCondition" ADD CONSTRAINT "UserHealthCondition_resolvedBy_fkey" FOREIGN KEY ("resolvedBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
