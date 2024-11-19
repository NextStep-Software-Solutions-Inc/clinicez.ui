/*
  Warnings:

  - You are about to drop the column `type` on the `HealthcareProvider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,hpTypeId]` on the table `HealthcareProvider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `hpTypeId` to the `HealthcareProvider` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "HealthcareProvider" DROP CONSTRAINT "HealthcareProvider_type_fkey";

-- DropIndex
DROP INDEX "HealthcareProvider_userId_type_key";

-- AlterTable
ALTER TABLE "HealthcareProvider" DROP COLUMN "type",
ADD COLUMN     "hpTypeId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProvider_userId_hpTypeId_key" ON "HealthcareProvider"("userId", "hpTypeId");

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_hpTypeId_fkey" FOREIGN KEY ("hpTypeId") REFERENCES "HealthcareProviderType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
