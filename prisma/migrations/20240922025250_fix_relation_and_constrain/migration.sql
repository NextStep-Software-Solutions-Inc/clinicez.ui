/*
  Warnings:

  - You are about to drop the column `roleId` on the `OrgRoleAppointmentTab` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[orgRoleId,orgAppointmentTabId]` on the table `OrgRoleAppointmentTab` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgRoleId` to the `OrgRoleAppointmentTab` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrgRoleAppointmentTab" DROP CONSTRAINT "OrgRoleAppointmentTab_roleId_fkey";

-- DropIndex
DROP INDEX "OrgRoleAppointmentTab_roleId_orgAppointmentTabId_key";

-- AlterTable
ALTER TABLE "OrgRoleAppointmentTab" DROP COLUMN "roleId",
ADD COLUMN     "orgRoleId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrgRoleAppointmentTab_orgRoleId_orgAppointmentTabId_key" ON "OrgRoleAppointmentTab"("orgRoleId", "orgAppointmentTabId");

-- AddForeignKey
ALTER TABLE "OrgRoleAppointmentTab" ADD CONSTRAINT "OrgRoleAppointmentTab_orgRoleId_fkey" FOREIGN KEY ("orgRoleId") REFERENCES "UserOrganizationRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
