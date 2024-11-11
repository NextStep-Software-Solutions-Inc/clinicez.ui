/*
  Warnings:

  - You are about to drop the column `appointmentTabId` on the `OrgRoleAppointmentTab` table. All the data in the column will be lost.
  - You are about to drop the column `orgId` on the `OrgRoleAppointmentTab` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[roleId,orgAppointmentTabId]` on the table `OrgRoleAppointmentTab` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orgAppointmentTabId` to the `OrgRoleAppointmentTab` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "OrgRoleAppointmentTab" DROP CONSTRAINT "OrgRoleAppointmentTab_appointmentTabId_fkey";

-- DropForeignKey
ALTER TABLE "OrgRoleAppointmentTab" DROP CONSTRAINT "OrgRoleAppointmentTab_orgId_fkey";

-- DropIndex
DROP INDEX "OrgRoleAppointmentTab_orgId_roleId_appointmentTabId_key";

-- AlterTable
ALTER TABLE "OrgRoleAppointmentTab" DROP COLUMN "appointmentTabId",
DROP COLUMN "orgId",
ADD COLUMN     "orgAppointmentTabId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "OrgRoleAppointmentTab_roleId_orgAppointmentTabId_key" ON "OrgRoleAppointmentTab"("roleId", "orgAppointmentTabId");

-- AddForeignKey
ALTER TABLE "OrgRoleAppointmentTab" ADD CONSTRAINT "OrgRoleAppointmentTab_orgAppointmentTabId_fkey" FOREIGN KEY ("orgAppointmentTabId") REFERENCES "OrgAppointmentTab"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
