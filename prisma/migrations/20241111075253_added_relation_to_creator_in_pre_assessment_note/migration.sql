/*
  Warnings:

  - Changed the type of `createdBy` on the `PreAssessmentNote` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "PreAssessmentNote" DROP COLUMN "createdBy",
ADD COLUMN     "createdBy" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PreAssessmentNote_appointmentId_createdBy_key" ON "PreAssessmentNote"("appointmentId", "createdBy");

-- AddForeignKey
ALTER TABLE "PreAssessmentNote" ADD CONSTRAINT "PreAssessmentNote_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
