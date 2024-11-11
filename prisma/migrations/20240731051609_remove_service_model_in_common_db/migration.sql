/*
  Warnings:

  - You are about to drop the `OrganizationService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OrganizationServiceCategory` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OrganizationService" DROP CONSTRAINT "OrganizationService_category_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationService" DROP CONSTRAINT "OrganizationService_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "OrganizationServiceCategory" DROP CONSTRAINT "OrganizationServiceCategory_organizationId_fkey";

-- DropTable
DROP TABLE "OrganizationService";

-- DropTable
DROP TABLE "OrganizationServiceCategory";
