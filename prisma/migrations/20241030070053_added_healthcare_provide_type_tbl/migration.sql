/*
  Warnings:

  - Changed the type of `type` on the `HealthcareProvider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "HealthcareProvider" DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL;

-- DropEnum
DROP TYPE "HealthcareProviderType";

-- CreateTable
CREATE TABLE "HealthcareProviderType" (
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true
);

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProviderType_name_key" ON "HealthcareProviderType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "HealthcareProvider_userId_type_key" ON "HealthcareProvider"("userId", "type");

-- AddForeignKey
ALTER TABLE "HealthcareProvider" ADD CONSTRAINT "HealthcareProvider_type_fkey" FOREIGN KEY ("type") REFERENCES "HealthcareProviderType"("name") ON DELETE RESTRICT ON UPDATE CASCADE;
