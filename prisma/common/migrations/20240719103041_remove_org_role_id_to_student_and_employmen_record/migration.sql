/*
  Warnings:

  - You are about to drop the column `organizationRoleId` on the `UserEmploymentRecord` table. All the data in the column will be lost.
  - You are about to drop the column `organizationRoleId` on the `UserStudentRecord` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserEmploymentRecord" DROP CONSTRAINT "UserEmploymentRecord_organizationRoleId_fkey";

-- DropForeignKey
ALTER TABLE "UserStudentRecord" DROP CONSTRAINT "UserStudentRecord_organizationRoleId_fkey";

-- AlterTable
ALTER TABLE "UserEmploymentRecord" DROP COLUMN "organizationRoleId",
ADD COLUMN     "userOrganizationRoleId" INTEGER;

-- AlterTable
ALTER TABLE "UserStudentRecord" DROP COLUMN "organizationRoleId",
ADD COLUMN     "userOrganizationRoleId" INTEGER;

-- AddForeignKey
ALTER TABLE "UserStudentRecord" ADD CONSTRAINT "UserStudentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "UserOrganizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEmploymentRecord" ADD CONSTRAINT "UserEmploymentRecord_userOrganizationRoleId_fkey" FOREIGN KEY ("userOrganizationRoleId") REFERENCES "UserOrganizationRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;
