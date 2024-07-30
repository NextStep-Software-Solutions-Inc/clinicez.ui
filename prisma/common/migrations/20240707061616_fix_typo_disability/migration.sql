/*
  Warnings:

  - You are about to drop the `Disablity` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "UserHealthCondition" ALTER COLUMN "status" DROP NOT NULL;

-- DropTable
DROP TABLE "Disablity";

-- CreateTable
CREATE TABLE "Disability" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Disability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Disability_name_key" ON "Disability"("name");

-- AddForeignKey
ALTER TABLE "UserDisability" ADD CONSTRAINT "UserDisability_disabilityId_fkey" FOREIGN KEY ("disabilityId") REFERENCES "Disability"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
