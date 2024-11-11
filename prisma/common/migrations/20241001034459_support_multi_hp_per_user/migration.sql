/*
  Warnings:

  - A unique constraint covering the columns `[userId,type]` on the table `HealthcareProvider` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "HealthcareProvider_userId_key";

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProvider_userId_type_key" ON "HealthcareProvider"("userId", "type");
