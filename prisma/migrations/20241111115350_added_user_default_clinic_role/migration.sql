/*
  Warnings:

  - You are about to drop the column `organizationRoleId` on the `ClinicRoleAppointmentTab` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ClinicRoleAppointmentTab" DROP CONSTRAINT "ClinicRoleAppointmentTab_organizationRoleId_fkey";

-- AlterTable
ALTER TABLE "ClinicRoleAppointmentTab" DROP COLUMN "organizationRoleId";

-- CreateTable
CREATE TABLE "UserDefaultClinicRole" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "clinicId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "UserDefaultClinicRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDefaultClinicRole_userId_clinicId_roleId_key" ON "UserDefaultClinicRole"("userId", "clinicId", "roleId");

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "ClinicMemberRole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserDefaultClinicRole" ADD CONSTRAINT "UserDefaultClinicRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
