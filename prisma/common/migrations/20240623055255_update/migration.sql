/*
  Warnings:

  - A unique constraint covering the columns `[userId,organizationId,role]` on the table `UserOrganization` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UserOrganizationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');

-- AlterTable
ALTER TABLE "UserOrganization" ADD COLUMN     "acceptedAt" DATE,
ADD COLUMN     "acceptedBy" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" "UserOrganizationStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_role_key" ON "UserOrganization"("userId", "organizationId", "role");

-- AddForeignKey
ALTER TABLE "UserOrganization" ADD CONSTRAINT "UserOrganization_acceptedBy_fkey" FOREIGN KEY ("acceptedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
